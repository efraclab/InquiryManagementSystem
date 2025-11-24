using Dapper;
using InquiryManagementWebService.Models;
using Microsoft.Data.SqlClient;

namespace InquiryManagementWebService.Repositories
{

    public class InquiryRepository : IInquiryRepository
    {
        private readonly string _connectionString;
        public InquiryRepository(IConfiguration configuration)
        {
            _connectionString = configuration["Connnectionstrings:MyConnection"];
        }

        public async Task<IEnumerable<Inquiry>> GetInquiriesAsync(InquiryRequest request)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
;WITH QuotationsWithReg AS
(
    SELECT 
        i.QUOTNO,
        i.QUOTEQNO,
        r1.TRN2REFNO,
        i.QuotDate,
        i.QUOTENQDATE,
        i.QUOTAMT,
        i.QUOTDISCOUNTAXAMT,
        i.QUOT_SALESPERSONCD,
        bd.CODEDESC AS BDName,
        i.QUOTPARTYCD,
        c.CUSTNAME AS ClientName,
        i.QUOTSEMPLECHARGE,
        i.QUOTMISC,
        i.QUOTHCC,
        i.QUOTUSD,         
        i.USDRATE,         
        r1.TRN2TESTRATE,
        r2.TRN1DATE,
        r2.TRN1CANCEL,
        SUBSTRING(i.QUOTNO, 11, 3) AS Vertical,
        ROW_NUMBER() OVER (PARTITION BY i.QUOTNO ORDER BY r2.TRN1DATE, r1.TRN2REFNO) AS RegRank,

        -- compute a single date column based on @DateField to avoid ORs on different columns
        CASE 
            WHEN @DateField = 'inqDate'  THEN i.QUOTENQDATE
            WHEN @DateField = 'quotDate' THEN i.QuotDate
            WHEN @DateField = 'regisDate' THEN r2.TRN1DATE
            ELSE NULL
        END AS SelectedDate

    FROM OQUOTMST i
    INNER JOIN OCUSTMST c 
        ON i.QUOTPARTYCD = c.CUSTACCCODE
    INNER JOIN OCODEMST bd 
        ON bd.CODECD = i.QUOT_SALESPERSONCD
    LEFT JOIN TRN205 r1 
        ON r1.TRN2QOTNO = i.QUOTNO
    LEFT JOIN TRN105 r2 
        ON r2.TRN1REFNO = r1.TRN2REFNO
    WHERE bd.CODETYPE = 'SP'

        -- BD filtering
        AND (
            @BDNames IS NULL 
            OR (
                (@ExcludeBDs = 0 AND bd.CODEDESC IN (SELECT Value FROM dbo.SplitStrings(@BDNames, ',')))
                OR (@ExcludeBDs = 1 AND bd.CODEDESC NOT IN (SELECT Value FROM dbo.SplitStrings(@BDNames, ',')))
            )
        )

        -- Client filtering
        AND (
            @ClientNames IS NULL 
            OR (
                (@ExcludeClients = 0 AND c.CUSTNAME IN (SELECT Value FROM dbo.SplitStrings(@ClientNames, ',')))
                OR (@ExcludeClients = 1 AND c.CUSTNAME NOT IN (SELECT Value FROM dbo.SplitStrings(@ClientNames, ',')))
            )
        )

        -- Vertical filtering
        AND (
            @Verticals IS NULL 
            OR (
                (@ExcludeVerticals = 0 AND SUBSTRING(i.QUOTNO, 11, 3) IN (SELECT Value FROM dbo.SplitStrings(@Verticals, ',')))
                OR (@ExcludeVerticals = 1 AND SUBSTRING(i.QUOTNO, 11, 3) NOT IN (SELECT Value FROM dbo.SplitStrings(@Verticals, ',')))
            )
        )

        -- Date range filtering on single SelectedDate column (sargable)
        AND (
            @FromDate IS NULL OR
            (
              CASE 
                WHEN @DateField = 'inqDate'  THEN i.QUOTENQDATE
                WHEN @DateField = 'quotDate' THEN i.QuotDate
                WHEN @DateField = 'regisDate' THEN r2.TRN1DATE
                ELSE NULL
              END
            ) >= @FromDate
        )
        AND (
            @ToDate IS NULL OR
            (
              CASE 
                WHEN @DateField = 'inqDate'  THEN i.QUOTENQDATE
                WHEN @DateField = 'quotDate' THEN i.QuotDate
                WHEN @DateField = 'regisDate' THEN r2.TRN1DATE
                ELSE NULL
              END
            ) <= @ToDate
        )

        -- Year filtering (kept for parity)
        AND (
            @Year IS NULL OR (
                (@DateField = 'inqDate' AND YEAR(i.QUOTENQDATE) = @Year)
                OR (@DateField = 'quotDate' AND YEAR(i.QuotDate) = @Year)
                OR (@DateField = 'regisDate' AND YEAR(r2.TRN1DATE) = @Year)
            )
        )

        -- Month filtering (kept for parity)
        AND (
            @Month IS NULL OR (
                (@DateField = 'inqDate' AND MONTH(i.QUOTENQDATE) = @Month)
                OR (@DateField = 'quotDate' AND MONTH(i.QuotDate) = @Month)
                OR (@DateField = 'regisDate' AND MONTH(r2.TRN1DATE) = @Month)
            )
        )
),

MaxTat AS
(
    SELECT 
        TRN2REFNO,
        MAX(Trn2ParDate) AS MaxTatDate
    FROM TRN205
    WHERE TRN2REFNO IS NOT NULL
    GROUP BY TRN2REFNO
),

RegStatus AS
(
    SELECT 
        TRN2REFNO,
        CASE 
            WHEN MIN(
                    CASE 
                        WHEN TRN2MdateofReport IS NOT NULL THEN 1
                        ELSE 0
                    END
                ) = 1 
                THEN 'Released'
            ELSE 'Pending'
        END AS FinalStatus
    FROM TRN205
    GROUP BY TRN2REFNO
)

SELECT 
    q.QUOTNO AS QuotNo,
    q.QUOTEQNO AS InqNo,
    q.TRN2REFNO AS RegisNo,
    MIN(q.QuotDate) AS QuotDate,
    MIN(q.QUOTENQDATE) AS InqDate,

    CASE WHEN MAX(q.QUOTUSD) = 'Y'
         THEN MIN(q.QUOTAMT) * MAX(q.USDRATE)
         ELSE MIN(q.QUOTAMT) END AS QuotValBeforeDis,

    CASE WHEN MAX(q.QUOTUSD) = 'Y'
         THEN (MIN(q.QUOTAMT - ISNULL(q.QUOTDISCOUNTAXAMT,0))) * MAX(q.USDRATE)
         ELSE MIN(q.QUOTAMT - ISNULL(q.QUOTDISCOUNTAXAMT,0)) END AS QuotValAfterDis,

    CASE 
        WHEN MAX(q.TRN2REFNO) IS NOT NULL THEN 'Approved'
        ELSE 'Not Approved'
    END AS QuotStatus,

    CAST(
        CASE 
            WHEN MIN(q.QUOTAMT) IS NULL OR MIN(q.QUOTAMT) = 0 THEN NULL
            ELSE (MIN(ISNULL(q.QUOTDISCOUNTAXAMT,0)) * 100.0) / MIN(q.QUOTAMT)
        END AS DECIMAL(10,2)
    ) AS PercOfDis,

    MIN(q.TRN1DATE) AS RegisDate,
    MIN(q.QUOT_SALESPERSONCD) AS BdCode,
    MIN(q.BDName) AS BDName,
    MIN(q.QUOTPARTYCD) AS ClientCode,
    MIN(q.ClientName) AS ClientName,
    MIN(q.Vertical) AS Vertical,

    mt.MaxTatDate AS TatDate,
    rs.FinalStatus AS ReportStatus,

    MAX(
        CASE 
            WHEN q.TRN2REFNO IS NOT NULL THEN NULL
            WHEN q.QuotDate IS NULL THEN NULL
            ELSE DATEDIFF(DAY, q.QuotDate, GETDATE())
        END
    ) AS QuotAgeing,

    -- safer numeric conversion for sum of TRN2TESTRATE
    CASE 
        WHEN MAX(q.TRN1CANCEL) = 'Y' THEN 0
        ELSE 
            CASE WHEN MAX(q.QUOTUSD) = 'Y' 
                 THEN (
                        (
                            SUM(TRY_CAST(NULLIF(q.TRN2TESTRATE, '') AS DECIMAL(18,2))) 
                            * ( (MIN(q.QUOTAMT) - MIN(ISNULL(q.QUOTDISCOUNTAXAMT,0))) / NULLIF(MIN(q.QUOTAMT),0) )
                        )
                        + CASE WHEN MIN(q.RegRank) = 1 
                               THEN MIN(ISNULL(q.QUOTSEMPLECHARGE,0)) 
                                    + MIN(ISNULL(q.QUOTMISC,0)) 
                                    + MIN(ISNULL(q.QUOTHCC,0)) 
                               ELSE 0 END
                      ) * MAX(q.USDRATE)  
                 ELSE (
                        (
                            SUM(TRY_CAST(NULLIF(q.TRN2TESTRATE, '') AS DECIMAL(18,2))) 
                            * ( (MIN(q.QUOTAMT) - MIN(ISNULL(q.QUOTDISCOUNTAXAMT,0))) / NULLIF(MIN(q.QUOTAMT),0) )
                        )
                        + CASE WHEN MIN(q.RegRank) = 1 
                               THEN MIN(ISNULL(q.QUOTSEMPLECHARGE,0)) 
                                    + MIN(ISNULL(q.QUOTMISC,0)) 
                                    + MIN(ISNULL(q.QUOTHCC,0)) 
                               ELSE 0 END
                      ) 
            END
    END AS RegisVal

FROM QuotationsWithReg q
LEFT JOIN MaxTat mt ON q.TRN2REFNO = mt.TRN2REFNO
LEFT JOIN RegStatus rs ON q.TRN2REFNO = rs.TRN2REFNO

GROUP BY 
    q.QUOTNO, 
    q.QUOTEQNO, 
    q.TRN2REFNO,
    mt.MaxTatDate,
    rs.FinalStatus;

                ";

                var verticals = request.Verticals?.Any() == true ? string.Join(",", request.Verticals) : null;
                var bdNames = request.BdNames?.Any() == true ? string.Join(",", request.BdNames) : null;
                var clientNames = request.ClientNames?.Any() == true ? string.Join(",", request.ClientNames) : null;

                return await connection.QueryAsync<Inquiry>(query, new
                {
                    FromDate = request.FromDate,
                    ToDate = request.ToDate,
                    Year = request.Year,
                    Month = request.Month,
                    Verticals = verticals,
                    BDNames = bdNames,
                    ClientNames = clientNames,
                    DateField = request.DateField,
                    ExcludeBDs = request.ExcludeBds ? 1 : 0,
                    ExcludeClients = request.ExcludeClients ? 1 : 0,
                    ExcludeVerticals = request.ExcludeVerticals ? 1 : 0
                });
            }
        }

        public async Task<IEnumerable<string>> GetVerticalsAsync(InquiryRequest request)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
SELECT DISTINCT SUBSTRING(i.QUOTNO, 11, 3) AS Vertical
FROM OQUOTMST i
INNER JOIN OCODEMST bd ON bd.CODECD = i.QUOT_SALESPERSONCD
INNER JOIN OCUSTMST c ON i.QUOTPARTYCD = c.CUSTACCCODE
WHERE bd.CODETYPE = 'SP'
  AND (
      @BDNames IS NULL OR bd.CODEDESC IN (SELECT Value FROM dbo.SplitStrings(@BDNames, ','))
  )
  AND (
      @ClientNames IS NULL OR c.CUSTNAME IN (SELECT Value FROM dbo.SplitStrings(@ClientNames, ','))
  )
  AND (
      (@DateField = 'inqDate' AND (@FromDate IS NULL OR i.QUOTENQDATE >= @FromDate) AND (@ToDate IS NULL OR i.QUOTENQDATE <= @ToDate))
      OR (@DateField = 'quotDate' AND (@FromDate IS NULL OR i.QuotDate >= @FromDate) AND (@ToDate IS NULL OR i.QuotDate <= @ToDate))
  )
  AND (@Year IS NULL OR (
      (@DateField = 'inqDate' AND YEAR(i.QUOTENQDATE) = @Year)
      OR (@DateField = 'quotDate' AND YEAR(i.QuotDate) = @Year)
  ))
  AND (@Month IS NULL OR (
      (@DateField = 'inqDate' AND MONTH(i.QUOTENQDATE) = @Month)
      OR (@DateField = 'quotDate' AND MONTH(i.QuotDate) = @Month)
  ))
ORDER BY Vertical;
";

                var bdNames = request.BdNames?.Any() == true ? string.Join(",", request.BdNames) : null;
                var clientNames = request.ClientNames?.Any() == true ? string.Join(",", request.ClientNames) : null;

                return await connection.QueryAsync<string>(query, new
                {
                    FromDate = request.FromDate,
                    ToDate = request.ToDate,
                    Year = request.Year,
                    Month = request.Month,
                    BDNames = bdNames,
                    ClientNames = clientNames,
                    DateField = request.DateField
                });
            }
        }

        public async Task<IEnumerable<BdDetail>> GetBdNamesAsync(InquiryRequest request)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
SELECT bd.CODEDESC AS BDName, 
MAX(bd.CODECD) AS BdCode
FROM OQUOTMST i
INNER JOIN OCODEMST bd ON bd.CODECD = i.QUOT_SALESPERSONCD
INNER JOIN OCUSTMST c ON c.CUSTACCCODE = i.QUOTPARTYCD
WHERE bd.CODETYPE = 'SP'
  AND (
      @ClientNames IS NULL OR c.CUSTNAME IN (SELECT Value FROM dbo.SplitStrings(@ClientNames, ','))
  )
  AND (
      @Verticals IS NULL OR SUBSTRING(i.QUOTNO, 11, 3) IN (SELECT Value FROM dbo.SplitStrings(@Verticals, ','))
  )
  AND (
      (@DateField = 'inqDate' AND (@FromDate IS NULL OR i.QUOTENQDATE >= @FromDate) AND (@ToDate IS NULL OR i.QUOTENQDATE <= @ToDate))
      OR (@DateField = 'quotDate' AND (@FromDate IS NULL OR i.QuotDate >= @FromDate) AND (@ToDate IS NULL OR i.QuotDate <= @ToDate))
  )
GROUP BY bd.CODEDESC
ORDER BY bd.CODEDESC;
";

                var verticals = request.Verticals?.Any() == true ? string.Join(",", request.Verticals) : null;
                var clientNames = request.ClientNames?.Any() == true ? string.Join(",", request.ClientNames) : null;

                return await connection.QueryAsync<BdDetail>(query, new
                {
                    FromDate = request.FromDate,
                    ToDate = request.ToDate,
                    Verticals = verticals,
                    ClientNames = clientNames,
                    DateField = request.DateField
                });
            }
        }

        public async Task<IEnumerable<ClientDetail>> GetClientNamesAsync(InquiryRequest request)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
SELECT c.CUSTNAME AS ClientName,
MAX(c.CUSTACCCODE) AS ClientCode
FROM OQUOTMST i
INNER JOIN OCUSTMST c ON i.QUOTPARTYCD = c.CUSTACCCODE
INNER JOIN OCODEMST bd ON bd.CODECD = i.QUOT_SALESPERSONCD
WHERE bd.CODETYPE = 'SP'
  AND (
      @BDNames IS NULL OR bd.CODEDESC IN (SELECT Value FROM dbo.SplitStrings(@BDNames, ','))
  )
  AND (
      @Verticals IS NULL OR SUBSTRING(i.QUOTNO, 11, 3) IN (SELECT Value FROM dbo.SplitStrings(@Verticals, ','))
  )
  AND (
      (@DateField = 'inqDate' AND (@FromDate IS NULL OR i.QUOTENQDATE >= @FromDate) AND (@ToDate IS NULL OR i.QUOTENQDATE <= @ToDate))
      OR (@DateField = 'quotDate' AND (@FromDate IS NULL OR i.QuotDate >= @FromDate) AND (@ToDate IS NULL OR i.QuotDate <= @ToDate))
  )
GROUP BY c.CUSTNAME
ORDER BY c.CUSTNAME;
";

                var verticals = request.Verticals?.Any() == true ? string.Join(",", request.Verticals) : null;
                var bdNames = request.BdNames?.Any() == true ? string.Join(",", request.BdNames) : null;

                return await connection.QueryAsync<ClientDetail>(query, new
                {
                    FromDate = request.FromDate,
                    ToDate = request.ToDate,
                    Verticals = verticals,
                    BDNames = bdNames,
                    DateField = request.DateField
                });
            }
        }

    }


}
