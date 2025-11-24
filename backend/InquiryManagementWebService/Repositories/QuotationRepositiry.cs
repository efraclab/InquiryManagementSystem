using Dapper;
using InquiryManagementWebService.Models;
using Microsoft.Data.SqlClient;

namespace InquiryManagementWebService.Repositories
{
    public class QuotationRepositiry : IQuotationRepositiry
    {

        private readonly string _connectionString;
        public QuotationRepositiry(IConfiguration configuration)
        {
            _connectionString = configuration["Connnectionstrings:MyConnection"];
        }


        public async Task<IEnumerable<Quotation>> GetPendingQuotationAsync(QuotationRequest request)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
                ;WITH QuotationsWithReg AS
                (
                    SELECT 
                        q.QUOTNO,
                        r1.TRN2REFNO,
                        q.QuotDate,
                        q.QUOTAMT,
                        q.QUOTDISCOUNTAXAMT,
                        q.QUOT_SALESPERSONCD,
                        bd.CODEDESC,
                        q.QUOTPARTYCD,
		                q.IsLive,
                        q.ClosingRemarks,
                        c.CUSTNAME,
                        c.CUSTCITY,
		                c.CUSTADD1,
		                c.CUSTPIN,
		                c.CUSTUNIT,
                        SUBSTRING(q.QUOTNO, 11, 3) AS Vertical
                    FROM OQUOTMST q
                    INNER JOIN OCUSTMST c 
                        ON q.QUOTPARTYCD = c.CUSTACCCODE
                    INNER JOIN OCODEMST bd 
                        ON bd.CODECD = q.QUOT_SALESPERSONCD
                    LEFT JOIN TRN205 r1 
                        ON r1.TRN2QOTNO = q.QUOTNO
                    WHERE bd.CODETYPE = 'SP'
                ),

                QuotationsWithSample AS
                (
                    SELECT DISTINCT
		                t.TRN2REFNO,
		                p.PRODDESC
	                FROM TEMP_TRN205 t
	                JOIN OPRODMST p
		                ON t.TRN2CODECD = p.PRODCD
                )

                SELECT
                    q.QUOTNO AS QuotNo,
                    q.QuotDate,
                    q.QUOTAMT AS QuotValBeforeDis,
                    (q.QUOTAMT - ISNULL(q.QUOTDISCOUNTAXAMT,0)) AS QuotValAfterDis,
                    q.QUOT_SALESPERSONCD AS BdCode,
                    q.CODEDESC AS BdName,
                    q.QUOTPARTYCD AS ClientCode,
                    q.CUSTNAME AS ClientName,
                    q.CUSTCITY AS ClientCity,
	                q.CUSTADD1 AS ClientAddress,
	                q.CUSTUNIT AS ClientUnit,
                    q.Vertical,
                    q.IsLive,
                    q.ClosingRemarks,
                    CAST(
                        CASE 
                            WHEN q.QUOTAMT IS NULL OR q.QUOTAMT = 0 THEN NULL
                            ELSE (ISNULL(q.QUOTDISCOUNTAXAMT,0) * 100.0) / q.QUOTAMT
                        END 
                    AS DECIMAL(10,2)) AS PercOfDis,
                    DATEDIFF(DAY, q.QuotDate, GETDATE()) AS QuotAgeing,
	                s.PRODDESC AS SampleName

                FROM QuotationsWithReg q
                JOIN QuotationsWithSample s
	                ON q.QUOTNO = s.TRN2REFNO
                WHERE
                    q.TRN2REFNO IS NULL
                    AND (@FromDate IS NULL OR q.QuotDate >= @FromDate)
                    AND (@ToDate   IS NULL OR q.QuotDate <= @ToDate)
                    AND (@QuotNo IS NULL OR q.QUOTNO = @QuotNo)
                    AND (
                        @AgeFilter IS NULL
                        OR (@AgeFilter = '30'  AND DATEDIFF(DAY, q.QuotDate, GETDATE()) BETWEEN 0 AND 30)
                        OR (@AgeFilter = '60'  AND DATEDIFF(DAY, q.QuotDate, GETDATE()) BETWEEN 0 AND 60)
                        OR (@AgeFilter = '90'  AND DATEDIFF(DAY, q.QuotDate, GETDATE()) BETWEEN 0 AND 90)
                        OR (@AgeFilter = '90+' 
                            AND DATEDIFF(DAY, q.QuotDate, GETDATE()) > 90
                            AND q.QuotDate >= '2025-04-01'
                        )
                    )
	                AND (
                    @CODECDList IS NULL
                    OR q.QUOT_SALESPERSONCD IN (SELECT Value FROM dbo.SplitStrings(@CODECDList, ','))
                )

                ORDER BY q.QuotDate DESC;
";

                var codecdList = (request.BdCodes != null && request.BdCodes.Any())
                    ? string.Join(",", request.BdCodes)
                    : null;


                return await connection.QueryAsync<Quotation>(query, new
                {
                    FromDate = request.FromDate,
                    ToDate = request.ToDate,
                    AgeFilter = request.AgeFilter,
                    QuotNo = request.QuotNo,
                    CODECDList = codecdList,
                });
            }
        }


        public async Task<bool> UpdateQuotationAsync(UpdateQuotationRequest request)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
                    UPDATE OQUOTMST
                    SET
                        IsLive = @IsLive,
                        ClosingRemarks = @ClosingRemarks
                    WHERE QUOTNO = @QuotNo;
                ";

                var rowsAffected = await connection.ExecuteAsync(query, new
                {
                    QuotNo = request.QuotNo,
                    IsLive = request.IsLive,
                    ClosingRemarks = request.ClosingRemarks
                });

                return rowsAffected > 0;
            }
        }

    }

}
