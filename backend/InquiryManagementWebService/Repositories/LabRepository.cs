using Dapper;
using InquiryManagementWebService.Models;
using Microsoft.Data.SqlClient;

namespace InquiryManagementWebService.Repositories
{
    public class LabRepository : ILabRepository
    {
        private readonly string _connectionString;
        public LabRepository(IConfiguration configuration)
        {
            _connectionString = configuration["Connnectionstrings:MyConnection"];
        }

        public async Task<SampleOverview> GetSampleOverviewAsync(SampleSummaryRequest request)
        {
            var query = @"
;WITH RegisRanker AS
(
    SELECT
        i.QUOTNO,
        r2.TRN2REFNO,
        i.QUOTAMT,
        i.QUOTDISCOUNTAXAMT,
        i.QUOTUSD,
        i.USDRATE,
        i.QUOTSEMPLECHARGE,
        i.QUOTMISC,
        i.QUOTHCC,
        r2.TRN2TESTRATE,
        r1.TRN1DATE,
        r1.TRN1CANCEL,
        ROW_NUMBER() OVER (PARTITION BY i.QUOTNO ORDER BY r1.TRN1DATE, r2.TRN2REFNO) AS RegRank
    FROM OQUOTMST i
    INNER JOIN TRN205 r2 ON r2.TRN2QOTNO = i.QUOTNO -- TRN205 is r2
    LEFT JOIN TRN105 r1 ON r1.TRN1REFNO = r2.TRN2REFNO -- TRN105 is r1
    WHERE r2.TRN2REFNO IS NOT NULL
      AND ((@FromDate IS NULL OR r1.TRN1DATE >= @FromDate) AND (@ToDate IS NULL OR r1.TRN1DATE <= @ToDate))
      AND (@Year IS NULL OR YEAR(r1.TRN1DATE) = @Year)
      AND (@Month IS NULL OR MONTH(r1.TRN1DATE) = @Month)
),
RegisBase AS
(
    SELECT
        r.TRN2REFNO AS RegisNo,
        
        CASE
            WHEN MAX(r.TRN1CANCEL) = 'Y' THEN 0
            ELSE
                CASE WHEN MAX(r.QUOTUSD) = 'Y'
                     THEN (
                               (
                                   SUM(CAST(NULLIF(r.TRN2TESTRATE, '') AS DECIMAL(18,2)))
                                   * ( (MIN(r.QUOTAMT) - MIN(ISNULL(r.QUOTDISCOUNTAXAMT,0))) / NULLIF(MIN(r.QUOTAMT),0) )
                               )
                               + CASE WHEN MIN(r.RegRank) = 1
                                      THEN MIN(r.QUOTSEMPLECHARGE)
                                           + MIN(r.QUOTMISC)
                                           + MIN(r.QUOTHCC)
                                      ELSE 0 END
                           ) * MAX(r.USDRATE)
                     ELSE (
                               (
                                   SUM(CAST(NULLIF(r.TRN2TESTRATE, '') AS DECIMAL(18,2)))
                                   * ( (MIN(r.QUOTAMT) - MIN(ISNULL(r.QUOTDISCOUNTAXAMT,0))) / NULLIF(MIN(r.QUOTAMT),0) )
                               )
                               + CASE WHEN MIN(r.RegRank) = 1
                                      THEN MIN(r.QUOTSEMPLECHARGE)
                                           + MIN(r.QUOTMISC)
                                           + MIN(r.QUOTHCC)
                                      ELSE 0 END
                           )
                END
        END AS RegisVal
    FROM RegisRanker r
    GROUP BY r.TRN2REFNO, r.QUOTNO
),
SampleData AS
(
    SELECT DISTINCT
        T2.TRN2REFNO AS RegistrationNo,
        T2.TRN2PRODALIAS AS SampleName,
        OCM1.codedesc AS Lab,
        T2.TRN2COMPLETIONDT,
        T2.TRN2HODReview AS HodReview,
        CASE WHEN T2.TRN2COMPLETIONDT IS NOT NULL AND T2.TRN2HODReview = 'Y' THEN 'Released' ELSE 'Pending' END AS Status
    FROM TRN205 AS T2
        INNER JOIN oheadmst AS HM ON HM.headPlantCd = T2.TRN2PLANTCD AND HM.headcd = T2.TRN2HEADER
        INNER JOIN OCODEMST AS OCM1 ON OCM1.CODEPLANTCD = T2.TRN2PLANTCD AND OCM1.CODECD = T2.TRN2DEPARTCD AND OCM1.CODETYPE = 'DM'
        INNER JOIN TRN105 AS t05 ON t05.TRN1PLANTCD = T2.TRN2PLANTCD AND t05.TRN1REFNO = T2.TRN2REFNO
    WHERE
        t05.TRN1PLANTCD = 'P001'
        AND (
                (t05.TRN1Date >= @FromDate AND t05.TRN1Date <= @ToDate)
                OR
                (@Month IS NOT NULL AND @Year IS NOT NULL
                 AND MONTH(t05.TRN1Date) = @Month
                 AND YEAR(t05.TRN1Date) = @Year)
            )
        AND (
            @Labs IS NULL
            OR (
                (@ExcludeLabs = 0 AND OCM1.codedesc IN (SELECT Value FROM dbo.SplitStrings(@Labs, ',')))
                OR
                (@ExcludeLabs = 1 AND OCM1.codedesc NOT IN (SELECT Value FROM dbo.SplitStrings(@Labs, ',')))
            )
        )

    UNION ALL

    SELECT DISTINCT
        TRN4REFNO AS RegistrationNo,
        TRN4REMARKS AS SampleName,
        'Training' AS Lab,
        NULL AS TRN2COMPLETIONDT,
        NULL AS HodReview,
        'Pending' AS Status
    FROM BILLMAIN b
    INNER JOIN TRN4STUDEND t ON b.blmncustcd = t.TRN4PARTYCD
    WHERE
        trn4plantcd = 'P001'
        AND (
                (t.TRN4Date >= @FromDate AND t.TRN4Date <= @ToDate)
                OR
                (@Month IS NOT NULL AND @Year IS NOT NULL
                 AND MONTH(t.TRN4Date) = @Month
                 AND YEAR(t.TRN4Date) = @Year)
            )
        AND (
            @Labs IS NULL
            OR (
                (@ExcludeLabs = 0 AND 'Training' IN (SELECT Value FROM dbo.SplitStrings(@Labs, ',')))
                OR
                (@ExcludeLabs = 1 AND 'Training' NOT IN (SELECT Value FROM dbo.SplitStrings(@Labs, ',')))
            )
        )
),
RegistrationStatus AS
(
    SELECT
        s.RegistrationNo,
        -- If the MIN status across all samples is 'Pending', the overall status is 'Pending'.
        MIN(s.Status) AS OverallStatus,
        MAX(r.RegisVal) AS TotalRegVal
    FROM SampleData s
    LEFT JOIN RegisBase r ON s.RegistrationNo = r.RegisNo
    GROUP BY s.RegistrationNo
)
SELECT
    COUNT(rs.RegistrationNo) AS TotalSamples, -- Unique Registrations
    SUM(CASE WHEN rs.OverallStatus = 'Released' THEN 1 ELSE 0 END) AS TotalReleased,
    SUM(CASE WHEN rs.OverallStatus = 'Pending' THEN 1 ELSE 0 END) AS TotalPending,
    SUM(rs.TotalRegVal) AS TotalRegValue, -- NEW COLUMN: Sum of all unique registration values
    SUM(CASE WHEN rs.OverallStatus = 'Pending' THEN rs.TotalRegVal ELSE 0 END) AS TotalPendingRegVal
FROM
    RegistrationStatus rs;
";

            using (var connection = new SqlConnection(_connectionString))
            {

                int? commandTimeout = 60;

                var labs = request.Labs?.Any() == true ? string.Join(",", request.Labs) : null;

                var mainResponse = await connection.QueryFirstAsync<SampleOverview>(query, new
                {
                    FromDate = request.FromDate,
                    ToDate = request.ToDate,
                    Month = request.Month,
                    Year = request.Year,
                    Labs = labs,
                    ExcludeLabs = request.ExcludeLabs ? 1 : 0
                }, commandTimeout: commandTimeout);

                const string DateFormat = "yyyy-MM-dd";
                DateTime fromDate = DateTime.Parse("2025-04-01");
                DateTime toDate = DateTime.Parse("2025-04-01");

                if (request.FromDate != null && request.ToDate != null)
                {
                    toDate = request.FromDate.Value.AddDays(-1);
                }
                else
                {
                    var year = request.Year.Value;
                    var month = request.Month.Value;

                    DateTime firstDayOfMonth = new DateTime(year, month, 1);
                    toDate = firstDayOfMonth.AddDays(-1);
                }

                var openingResponse = await connection.QueryFirstAsync<SampleOverview>(query, new
                {
                    FromDate = fromDate.ToString(DateFormat),
                    ToDate = toDate.ToString(DateFormat),
                    Month = "",
                    Year = "",
                    Labs = labs,
                    ExcludeLabs = request.ExcludeLabs ? 1 : 0
                }, commandTimeout: commandTimeout);

                mainResponse.TotalOpeningPending = openingResponse.TotalPending;

                return mainResponse;
            }
        }

        public async Task<IEnumerable<SampleSummary>> GetSampleSummaryAsync(SampleSummaryRequest request)
        {

            var query = @"
;WITH RegisRanker AS
(
    SELECT
        i.QUOTNO,
        r2.TRN2REFNO,
        i.QUOTAMT,
        i.QUOTDISCOUNTAXAMT,
        i.QUOTUSD,
        i.USDRATE,
        i.QUOTSEMPLECHARGE,
        i.QUOTMISC,
        i.QUOTHCC,
        r2.TRN2TESTRATE,
        r1.TRN1DATE,
        r1.TRN1CANCEL,
        ROW_NUMBER() OVER (PARTITION BY i.QUOTNO ORDER BY r1.TRN1DATE, r2.TRN2REFNO) AS RegRank
    FROM OQUOTMST i
    INNER JOIN TRN205 r2 ON r2.TRN2QOTNO = i.QUOTNO
    LEFT JOIN TRN105 r1 ON r1.TRN1REFNO = r2.TRN2REFNO
    WHERE r2.TRN2REFNO IS NOT NULL
      AND ((@FromDate IS NULL OR r1.TRN1DATE >= @FromDate) AND (@ToDate IS NULL OR r1.TRN1DATE <= @ToDate))
      AND (@Year IS NULL OR YEAR(r1.TRN1DATE) = @Year)
      AND (@Month IS NULL OR MONTH(r1.TRN1DATE) = @Month)
),
RegisBase AS
(
    SELECT
        r.TRN2REFNO AS RegisNo,
        CASE
            WHEN MAX(r.TRN1CANCEL) = 'Y' THEN 0
            ELSE
                CASE WHEN MAX(r.QUOTUSD) = 'Y'
                     THEN (
                               (
                                   SUM(CAST(NULLIF(r.TRN2TESTRATE, '') AS DECIMAL(18,2)))
                                   * ( (MIN(r.QUOTAMT) - MIN(ISNULL(r.QUOTDISCOUNTAXAMT,0))) / NULLIF(MIN(r.QUOTAMT),0) )
                               )
                               + CASE WHEN MIN(r.RegRank) = 1
                                      THEN MIN(r.QUOTSEMPLECHARGE)
                                           + MIN(r.QUOTMISC)
                                           + MIN(r.QUOTHCC)
                                      ELSE 0 END
                           ) * MAX(r.USDRATE)
                     ELSE (
                               (
                                   SUM(CAST(NULLIF(r.TRN2TESTRATE, '') AS DECIMAL(18,2)))
                                   * ( (MIN(r.QUOTAMT) - MIN(ISNULL(r.QUOTDISCOUNTAXAMT,0))) / NULLIF(MIN(r.QUOTAMT),0) )
                               )
                               + CASE WHEN MIN(r.RegRank) = 1
                                      THEN MIN(r.QUOTSEMPLECHARGE)
                                           + MIN(r.QUOTMISC)
                                           + MIN(r.QUOTHCC)
                                      ELSE 0 END
                           )
                END
        END AS RegisVal
    FROM RegisRanker r
    GROUP BY r.TRN2REFNO, r.QUOTNO
),
SampleData AS
(
    SELECT DISTINCT
        T2.TRN2REFNO AS RegistrationNo,
        FORMAT(
            DATEADD(SECOND, DATEDIFF(SECOND, 0, t05.TRN1TIME), t05.TRN1DATE),
            'dd/MM/yyyy HH:mm:ss'
        ) AS RegistrationDateTime,
        T2.TRN2PRODALIAS AS SampleName,
        T2.TRN2COMPLETIONDT,
        T2.TRN2HODReview AS HodReview
    FROM TRN205 AS T2
    INNER JOIN TRN105 AS t05 ON t05.TRN1PLANTCD = T2.TRN2PLANTCD AND t05.TRN1REFNO = T2.TRN2REFNO
    WHERE
        t05.TRN1PLANTCD = 'P001'
        AND (
            (t05.TRN1Date >= @FromDate AND t05.TRN1Date <= @ToDate)
            OR
            (@Month IS NOT NULL AND @Year IS NOT NULL
             AND MONTH(t05.TRN1Date) = @Month
             AND YEAR(t05.TRN1Date) = @Year)
        )
),
StatusData AS
(
    SELECT
        s.RegistrationNo,
        s.RegistrationDateTime,
        s.SampleName,
        CASE
            WHEN s.TRN2COMPLETIONDT IS NOT NULL AND s.HodReview = 'Y' THEN 'Released'
            ELSE 'Pending'
        END AS IndividualStatus
    FROM SampleData s
),
Grouped AS
(
    SELECT
        s.RegistrationNo,
        MAX(s.RegistrationDateTime) AS RegistrationDateTime,
        MIN(s.SampleName) AS SampleName,
        CASE
            WHEN COUNT(DISTINCT s.IndividualStatus) > 1 THEN 'PartialReleased'  -- ✅ mixed statuses
            WHEN MAX(s.IndividualStatus) = 'Pending' THEN 'Pending'
            ELSE 'Released'
        END AS Status
    FROM StatusData s
    GROUP BY s.RegistrationNo
)
SELECT
    g.RegistrationNo,
    g.RegistrationDateTime AS RegistrationDate,
    g.SampleName AS SampleName,
    g.Status,
    r.RegisVal
FROM Grouped g
LEFT JOIN RegisBase r ON g.RegistrationNo = r.RegisNo
ORDER BY g.RegistrationNo;
            ";

            using (var connection = new SqlConnection(_connectionString))
            {

                int? commandTimeout = 60;

                var labs = request.Labs?.Any() == true ? string.Join(",", request.Labs) : null;

                return await connection.QueryAsync<SampleSummary>(query, new
                {
                    FromDate = request.FromDate,
                    ToDate = request.ToDate,
                    Month = request.Month,
                    Year = request.Year,
                    Labs = labs,
                    ExcludeLabs = request.ExcludeLabs ? 1 : 0
                }, commandTimeout: commandTimeout);
            }
        }


        public async Task<IEnumerable<SampleDetails>> GetSampleDetailsByIdAsync(string regNo)
        {

            var query = @"
;WITH RegisRanker AS
(
    SELECT
        i.QUOTNO,
        r2.TRN2REFNO,
        i.QUOTAMT,
        i.QUOTDISCOUNTAXAMT,
        i.QUOTUSD,
        i.USDRATE,
        i.QUOTSEMPLECHARGE,
        i.QUOTMISC,
        i.QUOTHCC,
        r2.TRN2TESTRATE,
        r1.TRN1DATE,
        r2.Trn2Pardate AS TatDate,
        r1.TRN1CANCEL,
        ROW_NUMBER() OVER (PARTITION BY i.QUOTNO ORDER BY r1.TRN1DATE, r2.TRN2REFNO) AS RegRank
    FROM OQUOTMST i
    INNER JOIN TRN205 r2 ON r2.TRN2QOTNO = i.QUOTNO
    LEFT JOIN TRN105 r1 ON r1.TRN1REFNO = r2.TRN2REFNO
    WHERE r2.TRN2REFNO IS NOT NULL
),
RegisBase AS
(
    SELECT
        r.TRN2REFNO AS RegisNo,
        CASE
            WHEN MAX(r.TRN1CANCEL) = 'Y' THEN 0
            ELSE
                CASE WHEN MAX(r.QUOTUSD) = 'Y'
                     THEN (
                               (
                                   SUM(CAST(NULLIF(r.TRN2TESTRATE, '') AS DECIMAL(18,2)))
                                   * ( (MIN(r.QUOTAMT) - MIN(ISNULL(r.QUOTDISCOUNTAXAMT,0))) / NULLIF(MIN(r.QUOTAMT),0) )
                               )
                               + CASE WHEN MIN(r.RegRank) = 1
                                      THEN MIN(r.QUOTSEMPLECHARGE)
                                           + MIN(r.QUOTMISC)
                                           + MIN(r.QUOTHCC)
                                      ELSE 0 END
                           ) * MAX(r.USDRATE)
                     ELSE (
                               (
                                   SUM(CAST(NULLIF(r.TRN2TESTRATE, '') AS DECIMAL(18,2)))
                                   * ( (MIN(r.QUOTAMT) - MIN(ISNULL(r.QUOTDISCOUNTAXAMT,0))) / NULLIF(MIN(r.QUOTAMT),0) )
                               )
                               + CASE WHEN MIN(r.RegRank) = 1
                                      THEN MIN(r.QUOTSEMPLECHARGE)
                                           + MIN(r.QUOTMISC)
                                           + MIN(r.QUOTHCC)
                                      ELSE 0 END
                           )
                END
        END AS RegisVal
    FROM RegisRanker r
    GROUP BY r.TRN2REFNO, r.QUOTNO
),
SampleCount AS
(
    SELECT
        TRN2REFNO,
        COUNT(*) AS SampleCnt
    FROM TRN205
    WHERE TRN2REFNO IS NOT NULL
    GROUP BY TRN2REFNO
)
SELECT 
    t1.TRN1REFNO AS RegistrationNo, 
    CONVERT(NVARCHAR(10), t1.TRN1DATE, 103) AS RegistrationDate, 
    CONVERT(NVARCHAR(10), t2.Trn2Pardate, 103) AS TatDate, 
    CONVERT(NVARCHAR(10), t2.TRN2REPODT, 103) AS ReportIssueDate, 
    t2.TRN2PRODALIAS AS SampleName, 
    CASE
            WHEN T2.TRN2COMPLETIONDT IS NOT NULL THEN
                FORMAT(T2.TRN2COMPLETIONDT, 'dd/MM/yyyy HH:mm:ss')
            ELSE
                ''
        END AS AnalysisCompletionDateTime,
    CONVERT(NVARCHAR(10), t2.TRN2MdateofReport, 103) AS MailingDate,
    t2.TRN2HEADER AS ParaCode, 
    p.headdesc AS Parameter, 
    L.CODEDESC AS Lab,
    CAST(r.RegisVal / NULLIF(s.SampleCnt, 0) AS DECIMAL(18,2)) AS DistributedRegisVal,
    CASE 
        WHEN t2.TRN2COMPLETIONDT IS NOT NULL AND t2.TRN2REPODT IS NULL THEN 'Pending from QA End' 
        WHEN t2.TRN2REPODT IS NOT NULL AND t2.TRN2MdateofReport IS NULL THEN 'Report not Released' 
        WHEN t2.TRN2COMPLETIONDT IS NULL THEN 'Pending from Lab End' 
        WHEN t2.TRN2MdateofReport IS NOT NULL THEN 'Report Delivered' 
    END AS [Status] 
FROM 
    trn105 t1
INNER JOIN trn205 t2 ON t1.TRN1REFNO = t2.TRN2REFNO
INNER JOIN OHEADMST p ON t2.TRN2HEADER = p.headcd
INNER JOIN OCODEMST L ON t2.TRN2DEPARTCD = L.CODECD AND L.CODETYPE = 'DM'
LEFT JOIN RegisBase r ON t2.TRN2REFNO = r.RegisNo
LEFT JOIN SampleCount s ON t2.TRN2REFNO = s.TRN2REFNO
WHERE 
    t1.TRN1PLANTCD = 'P001' 
    AND t1.TRN1DATE BETWEEN '2025-04-01 00:00:00.000' AND '2026-03-31 00:00:00.000'
    AND (@RegNo IS NULL OR t1.TRN1REFNO = @RegNo)
ORDER BY 
    t1.TRN1REFNO, t2.TRN2PRODALIAS;
            ";

            using (var connection = new SqlConnection(_connectionString))
            {

                int? commandTimeout = 60;


                return await connection.QueryAsync<SampleDetails>(query, new
                {
                   RegNo = regNo
                }, commandTimeout: commandTimeout);
            }
        }

        public async Task<IEnumerable<LabSummary>> GetLabSummaryAsync(SampleSummaryRequest request)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
;WITH RegisRanker AS
(
    SELECT
        i.QUOTNO,
        r2.TRN2REFNO,
        i.QUOTAMT,
        i.QUOTDISCOUNTAXAMT,
        i.QUOTUSD,
        i.USDRATE,
        i.QUOTSEMPLECHARGE,
        i.QUOTMISC,
        i.QUOTHCC,
        r2.TRN2TESTRATE,
        r1.TRN1DATE,
        r1.TRN1CANCEL,
        ROW_NUMBER() OVER (PARTITION BY i.QUOTNO ORDER BY r1.TRN1DATE, r2.TRN2REFNO) AS RegRank
    FROM OQUOTMST i
    INNER JOIN TRN205 r2 ON r2.TRN2QOTNO = i.QUOTNO -- TRN205 is r2
    LEFT JOIN TRN105 r1 ON r1.TRN1REFNO = r2.TRN2REFNO -- TRN105 is r1
    WHERE r2.TRN2REFNO IS NOT NULL
      AND ((@FromDate IS NULL OR r1.TRN1DATE >= @FromDate) AND (@ToDate IS NULL OR r1.TRN1DATE <= @ToDate))
      AND (@Year IS NULL OR YEAR(r1.TRN1DATE) = @Year)
      AND (@Month IS NULL OR MONTH(r1.TRN1DATE) = @Month)
),
-- 2. RegisBase CTE: Groups the data and calculates the *Total* RegisVal for each distinct registration.
RegisBase AS
(
    SELECT
        r.TRN2REFNO AS RegisNo,
        
        -- Calculate RegisVal using the pre-aggregated fields
        CASE
            WHEN MAX(r.TRN1CANCEL) = 'Y' THEN 0
            ELSE
                CASE WHEN MAX(r.QUOTUSD) = 'Y'
                     THEN (
                               (
                                   SUM(CAST(NULLIF(r.TRN2TESTRATE, '') AS DECIMAL(18,2)))
                                   * ( (MIN(r.QUOTAMT) - MIN(ISNULL(r.QUOTDISCOUNTAXAMT,0))) / NULLIF(MIN(r.QUOTAMT),0) )
                               )
                               + CASE WHEN MIN(r.RegRank) = 1
                                      THEN MIN(r.QUOTSEMPLECHARGE)
                                           + MIN(r.QUOTMISC)
                                           + MIN(r.QUOTHCC)
                                      ELSE 0 END
                           ) * MAX(r.USDRATE)
                     ELSE (
                               (
                                   SUM(CAST(NULLIF(r.TRN2TESTRATE, '') AS DECIMAL(18,2)))
                                   * ( (MIN(r.QUOTAMT) - MIN(ISNULL(r.QUOTDISCOUNTAXAMT,0))) / NULLIF(MIN(r.QUOTAMT),0) )
                               )
                               + CASE WHEN MIN(r.RegRank) = 1
                                      THEN MIN(r.QUOTSEMPLECHARGE)
                                           + MIN(r.QUOTMISC)
                                           + MIN(r.QUOTHCC)
                                      ELSE 0 END
                           )
                END
        END AS RegisVal
    FROM RegisRanker r
    GROUP BY r.TRN2REFNO, r.QUOTNO
),
-- 3. SampleData CTE: Combines transactional and billing details for all samples
SampleData AS
(
    -- Part 1: Regular Lab Samples (TRN205 - T2, TRN105 - t05)
    SELECT DISTINCT
        BILLNO,
        T2.TRN2REFNO AS RegistrationNo,
        T2.TRN2PRODALIAS AS SampleName,
        OCM1.codedesc AS Lab,
        t05.TRN1DATE AS RegistrationDate, -- Use native date for calculations
        T2.Trn2Pardate AS TatDate,
        T2.TRN2COMPLETIONDT,
        T2.TRN2HODReview AS HodReview,
        -- Calculate status columns
        CASE WHEN T2.TRN2COMPLETIONDT IS NOT NULL AND T2.TRN2HODReview = 'Y' THEN 'Released' ELSE 'Pending' END AS Status
    FROM TRN205 AS T2
        INNER JOIN oheadmst AS HM ON HM.headPlantCd = T2.TRN2PLANTCD AND HM.headcd = T2.TRN2HEADER
        INNER JOIN OCODEMST AS OCM1 ON OCM1.CODEPLANTCD = T2.TRN2PLANTCD AND OCM1.CODECD = T2.TRN2DEPARTCD AND OCM1.CODETYPE = 'DM'
        INNER JOIN TRN105 AS t05 ON t05.TRN1PLANTCD = T2.TRN2PLANTCD AND t05.TRN1REFNO = T2.TRN2REFNO
        LEFT JOIN billmst ON BILLARNO = TRN2REFNO AND TRN1PLANTCD = BILLPLANTCD
    WHERE
        t05.TRN1PLANTCD = 'P001'
        AND (
                (t05.TRN1Date >= @FromDate AND t05.TRN1Date <= @ToDate)
                OR
                (@Month IS NOT NULL AND @Year IS NOT NULL
                 AND MONTH(t05.TRN1Date) = @Month
                 AND YEAR(t05.TRN1Date) = @Year)
            )
        AND (
            @Labs IS NULL
            OR (
                (@ExcludeLabs = 0 AND OCM1.codedesc IN (SELECT Value FROM dbo.SplitStrings(@Labs, ',')))
                OR
                (@ExcludeLabs = 1 AND OCM1.codedesc NOT IN (SELECT Value FROM dbo.SplitStrings(@Labs, ',')))
            )
        )

    UNION ALL

    -- Part 2: Training Records
    SELECT DISTINCT
        b.BLMNBILLNO AS BILLNO,
        TRN4REFNO AS RegistrationNo,
        TRN4REMARKS AS SampleName,
        'Training' AS Lab,
        t.TRN4DATE AS RegistrationDate,
        NULL AS TatDate,
        NULL AS TRN2COMPLETIONDT,
        NULL AS HodReview,
        'Pending' AS Status -- Assuming Training is always pending release in this context
    FROM BILLMAIN b
    INNER JOIN TRN4STUDEND t ON b.blmncustcd = t.TRN4PARTYCD
    WHERE
        trn4plantcd = 'P001'
        AND (
                (t.TRN4Date >= @FromDate AND t.TRN4Date <= @ToDate)
                OR
                (@Month IS NOT NULL AND @Year IS NOT NULL
                 AND MONTH(t.TRN4Date) = @Month
                 AND YEAR(t.TRN4Date) = @Year)
            )
        AND (
            @Labs IS NULL
            OR (
                (@ExcludeLabs = 0 AND 'Training' IN (SELECT Value FROM dbo.SplitStrings(@Labs, ',')))
                OR
                (@ExcludeLabs = 1 AND 'Training' NOT IN (SELECT Value FROM dbo.SplitStrings(@Labs, ',')))
            )
        )
),
-- 4. FinalData CTE: Joins SampleData with RegisVal and calculates the distributed value
FinalData AS
(
    SELECT
        s.*,
        r.RegisVal,
        -- Calculate distributed value
        CAST(
            r.RegisVal / NULLIF(COUNT(s.RegistrationNo) OVER (PARTITION BY s.RegistrationNo), 0)
            AS DECIMAL(18,2)
        ) AS DistributedRegisVal
    FROM SampleData s
    LEFT JOIN RegisBase r
        ON s.RegistrationNo = r.RegisNo
)
-- 5. FINAL SUMMARY SELECT
SELECT
    f.Lab,
    COUNT(f.RegistrationNo) AS Samples, -- Total Samples (Registrations)
    SUM(CASE WHEN f.Status = 'Pending' THEN 1 ELSE 0 END) AS Pendings,
    SUM(CASE WHEN f.Status = 'Released' THEN 1 ELSE 0 END) AS Released,

    -- Released TAT Analysis
    SUM(CASE WHEN f.Status = 'Released' AND DATEDIFF(DAY, f.TRN2COMPLETIONDT, f.TatDate) > 0 THEN 1 ELSE 0 END) AS ReleasedBeforeTat,
    SUM(CASE WHEN f.Status = 'Released' AND DATEDIFF(DAY, f.TRN2COMPLETIONDT, f.TatDate) = 0 THEN 1 ELSE 0 END) AS ReleasedOnTat,
    SUM(CASE WHEN f.Status = 'Released' AND DATEDIFF(DAY, f.TRN2COMPLETIONDT, f.TatDate) < 0 THEN 1 ELSE 0 END) AS ReleasedAfterTat,

    -- Pending TAT Analysis (using RegistrationDate and current date)
    SUM(CASE WHEN f.Status = 'Pending' AND DATEDIFF(DAY, GETDATE(), f.TatDate) > 0 THEN 1 ELSE 0 END) AS PendingBeforeTat, -- TAT date is in the future relative to today
    SUM(CASE WHEN f.Status = 'Pending' AND DATEDIFF(DAY, GETDATE(), f.TatDate) <= 0 THEN 1 ELSE 0 END) AS PendingBeyondTat, -- TAT date is today or in the past relative to today (i.e., missed TAT)
    
    -- Additional Pending metrics (assuming no direct way to track Invoiced/Billed status at sample level from provided columns)
    -- Setting these to 0 or based on the general BILLNO presence for TRN205 records, if reliable:
    SUM(CASE WHEN f.Status = 'Pending' AND f.BILLNO IS NOT NULL THEN 1 ELSE 0 END) AS PendingInvoiced,
    SUM(CASE WHEN f.Status = 'Pending' AND f.BILLNO IS NOT NULL THEN 1 ELSE 0 END) AS PendingBilled, -- Assuming Billed = Invoiced in this context

    -- Value Totals
    SUM(f.DistributedRegisVal) AS TotalRegValue,
    SUM(CASE WHEN f.Status = 'Pending' THEN f.DistributedRegisVal ELSE 0 END) AS PendingRegValue
    
FROM FinalData f
GROUP BY
    f.Lab
ORDER BY
    f.Lab;
";

                var labs = request.Labs?.Any() == true ? string.Join(",", request.Labs) : null;

                return await connection.QueryAsync<LabSummary>(query, new
                {
                    FromDate = request.FromDate,
                    ToDate = request.ToDate,
                    Month = request.Month,
                    Year = request.Year,
                    Labs = labs,
                    ExcludeLabs = request.ExcludeLabs ? 1 : 0
                });
            }
        }

        public async Task<IEnumerable<string>> GetLabsAsync(SampleSummaryRequest request)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
                    SELECT DISTINCT 
                        OC.CODEDESC AS LabName
                    FROM TRN105 R1
                    LEFT JOIN TRN205 R2 
                        ON R1.TRN1REFNO = R2.TRN2REFNO
                    LEFT JOIN OHEADMST OH 
                        ON R2.TRN2HEADER = OH.HEADCD
                    LEFT JOIN OCODEMST OC 
                        ON OH.HEADDEPARTMENT = OC.CODECD
                    WHERE 
                        OC.CODETYPE = 'DM'
                        AND (
                            (@Month IS NOT NULL AND @Year IS NOT NULL 
                                AND R1.TRN1DATE >= DATEFROMPARTS(@Year, @Month, 1)
                                AND R1.TRN1DATE < DATEADD(month, 1, DATEFROMPARTS(@Year, @Month, 1)))
                            OR (@FromDate IS NOT NULL AND @ToDate IS NOT NULL 
                                AND R1.TRN1DATE BETWEEN @FromDate AND @ToDate)
                            OR (@Month IS NULL AND @Year IS NULL AND @FromDate IS NULL AND @ToDate IS NULL)
                        )
                    ORDER BY 
                        OC.CODEDESC;
                ";


                return await connection.QueryAsync<string>(query, new
                {
                    FromDate = request.FromDate,
                    ToDate = request.ToDate,
                    Year = request.Year,
                    Month = request.Month,
                });
            }
        }
    }
}
