using Dapper;
using InquiryManagementWebService.Models;
using Microsoft.Data.SqlClient;
using System.Numerics;

namespace InquiryManagementWebService.Repositories
{
    public class MasterRepository : IMasterRepository
    {
        private readonly string _connectionString;

        public MasterRepository(IConfiguration configuration)
        {
            _connectionString = configuration["Connnectionstrings:MyConnection"];
        }

        public async Task<IEnumerable<CommodityDetail>> GetCommodityDetailsAsync(CommodityRequest request)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
                    IF (
                            @CommodityCode IS NULL
                            AND @RegulationCode IS NULL
                            AND @VerticalCode IS NULL
                            AND @CommodityGroupCode IS NULL
                            AND ( @SearchFilter IS NULL OR @SearchFilter = '' )
                       )
                    BEGIN
                        SELECT TOP 0 *
                        FROM Regulation;
                        RETURN;
                    END;

                    SELECT DISTINCT
                        R.RegulationCode,
                        R.RegulationName,
                        R.RegPlant,
                        R.RegParameter AS ParameterCode,
                        H.HEADDESC AS ParameterName,

                        R.ParameterGroupCode,
                        PG.CODEDESC AS ParameterGroupName,

                        C.CatagoryCode AS CommodityCode,
                        C.CatagoryName AS CommodityName,

                        CG.CommodityGroupCode,
                        CG.CommodityGroupName,

                        LAB.CODEDESC AS LabName,
                        LAB.CODECD AS LabCode,

                        H.headTAT AS TAT,

                        R.RegCommodityParameterN AS VerticalCode,
                        CASE 
                            WHEN R.RegCommodityParameterN = '001' THEN 'Non-FSSAI'
                            WHEN R.RegCommodityParameterN = '002' THEN 'FSSAI'
                            WHEN R.RegCommodityParameterN = '003' THEN 'Drug'
                            ELSE 'Unknown'
                        END AS VerticalName

                    FROM Regulation R

                    LEFT JOIN CatagoryMST C 
                        ON C.CatagoryCode = R.CommodityCode

                    LEFT JOIN CommodityGroup CG
                        ON CG.CommodityGroupCode = R.CommodityGroupCode

                    LEFT JOIN OHEADMST H
                        ON H.HEADCD = R.RegParameter

                    LEFT JOIN OCODEMST PG
                        ON PG.CODECD = R.ParameterGroupCode
                           AND PG.CODETYPE = 'GM'

                    OUTER APPLY (
                        SELECT TOP 1 *
                        FROM CATAGORY_PARAMETER CP
                        WHERE CP.ParameterCD = R.RegParameter
                          AND CP.CatagoryCD = R.CommodityCode
                    ) CP

                    LEFT JOIN OCODEMST LAB
                        ON LAB.CODECD = CP.CommodityLabDistCode
                           AND LAB.CODETYPE = 'DM'

                    WHERE
                        R.RegulationCode = COALESCE(@RegulationCode, R.RegulationCode)
                        AND R.CommodityCode = COALESCE(@CommodityCode, R.CommodityCode)
                        AND R.RegCommodityParameterN = COALESCE(@VerticalCode, R.RegCommodityParameterN)
                        AND R.CommodityGroupCode = COALESCE(@CommodityGroupCode, R.CommodityGroupCode)
                        AND (
                                @SearchFilter IS NULL OR @SearchFilter = ''
                                OR C.CatagoryName LIKE '%' + @SearchFilter + '%'
                                OR C.CatagoryCode LIKE '%' + @SearchFilter + '%'
                                OR H.HEADDESC LIKE '%' + @SearchFilter + '%'
                                OR H.HEADCD LIKE '%' + @SearchFilter + '%'
                                OR LAB.CODECD LIKE '%' + @SearchFilter + '%'
                                OR LAB.CODEDESC LIKE '%' + @SearchFilter + '%'
                                OR R.RegulationCode LIKE '%' + @SearchFilter + '%'
                                OR R.RegulationName LIKE '%' + @SearchFilter + '%'
                            )

                    ORDER BY R.RegParameter

                    OFFSET CASE 
                            WHEN @PageSize > 0 AND @PageNumber > 0 
                            THEN (@PageNumber - 1) * @PageSize 
                            ELSE 0 
                           END ROWS

                    FETCH NEXT CASE 
                                WHEN @PageSize > 0 AND @PageNumber > 0 
                                THEN @PageSize 
                                ELSE 2147483647
                              END ROWS ONLY;

                ";


                var parameters = new
                {
                    request.CommodityCode,
                    request.CommodityGroupCode,
                    request.LabCode,
                    request.VerticalCode,
                    request.RegulationCode,
                    request.SearchFilter,
                    PageNumber = request.PageNumber,
                    PageSize = request.PageSize
                };

                return await connection.QueryAsync<CommodityDetail>(query, parameters);
            }
        }

        public async Task<IEnumerable<long>> GetCommodityDetailsCountAsync(CommodityRequest request)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
                    IF (
                        @CommodityCode IS NULL
                        AND @RegulationCode IS NULL
                        AND @VerticalCode IS NULL
                        AND @CommodityGroupCode IS NULL
                        AND ( @SearchFilter IS NULL OR @SearchFilter = '' )
                        )
                    BEGIN
                        SELECT 0 AS TotalRows;
                        RETURN;
                    END;

                    SELECT COUNT(*)
                    FROM (
                        SELECT DISTINCT
                            R.RegulationCode,
                            R.RegulationName,
                            R.RegPlant,
                            R.RegParameter,
                            R.ParameterGroupCode,
                            C.CatagoryCode,
                            CG.CommodityGroupCode,
                            LAB.CODECD,
                            R.RegCommodityParameterN
                        FROM Regulation R

                        LEFT JOIN CatagoryMST C 
                            ON C.CatagoryCode = R.CommodityCode

                        LEFT JOIN CommodityGroup CG
                            ON CG.CommodityGroupCode = R.CommodityGroupCode

                        LEFT JOIN OHEADMST H
                            ON H.HEADCD = R.RegParameter

                        LEFT JOIN OCODEMST PG
                            ON PG.CODECD = R.ParameterGroupCode
                               AND PG.CODETYPE = 'GM'

                        OUTER APPLY (
                            SELECT TOP 1 *
                            FROM CATAGORY_PARAMETER CP
                            WHERE CP.ParameterCD = R.RegParameter
                              AND CP.CatagoryCD = R.CommodityCode
                        ) CP

                        LEFT JOIN OCODEMST LAB
                            ON LAB.CODECD = CP.CommodityLabDistCode
                               AND LAB.CODETYPE = 'DM'

                        WHERE
                            R.RegulationCode = COALESCE(@RegulationCode, R.RegulationCode)
                            AND R.CommodityCode = COALESCE(@CommodityCode, R.CommodityCode)
                            AND R.RegCommodityParameterN = COALESCE(@VerticalCode, R.RegCommodityParameterN)
                            AND R.CommodityGroupCode = COALESCE(@CommodityGroupCode, R.CommodityGroupCode)
                            AND (
                                    @SearchFilter IS NULL OR @SearchFilter = ''
                                    OR C.CatagoryName LIKE '%' + @SearchFilter + '%'
                                    OR C.CatagoryCode LIKE '%' + @SearchFilter + '%'
                                    OR H.HEADDESC LIKE '%' + @SearchFilter + '%'
                                    OR H.HEADCD LIKE '%' + @SearchFilter + '%'
                                    OR LAB.CODECD LIKE '%' + @SearchFilter + '%'
                                    OR LAB.CODEDESC LIKE '%' + @SearchFilter + '%'
                                    OR R.RegulationCode LIKE '%' + @SearchFilter + '%'
                                    OR R.RegulationName LIKE '%' + @SearchFilter + '%'
                                )
                    ) AS X;
";

                var parameters = new
                {
                    request.CommodityCode,
                    request.CommodityGroupCode,
                    request.LabCode,
                    request.VerticalCode,
                    request.RegulationCode,
                    request.SearchFilter
                };

                return await connection.QueryAsync<long>(query, parameters);
            }
        }

        public async Task<IEnumerable<Commodities>> GetCommoditiesAsync(string CommodityGroupCode)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
                    SELECT DISTINCT
                        C.CatagoryCode AS Code,
                        C.CatagoryName AS Name
                    FROM CatagoryMST C
                    WHERE
	                    C.CatagoryGroupCode = COALESCE(@CommodityGroupCode, C.CatagoryGroupCode)
                    ORDER BY C.CatagoryCode;
                ";


                return await connection.QueryAsync<Commodities>(query, new
                {
                    CommodityGroupCode
                });
            }
        }

        public async Task<IEnumerable<CommodityGroups>> GetCommodityGroupsAsync()
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
                    select distinct
	                    CommodityGroupCode AS Code, 
	                    CommodityGroupName AS Name
                    from CommodityGroup
                ";


                return await connection.QueryAsync<CommodityGroups>(query);
            }
        }

        public async Task<IEnumerable<Labs>> GetLabsAsync()
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
                    SELECT DISTINCT
                        CD1.CODECD AS Code,
                        CD1.CODEDESC AS Name
                    FROM OCODEMST CD1
                    WHERE CD1.CODETYPE = 'DM'
                    ORDER BY CD1.CODECD;
                ";


                return await connection.QueryAsync<Labs>(query);
            }
        }

        public async Task<IEnumerable<Verticals>> GetVerticalsAsync()
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
                    SELECT DISTINCT
                        P.CommodityParameterN AS Code,
                        CASE 
                            WHEN P.CommodityParameterN = '001' THEN 'Non-FSSAI'
                            WHEN P.CommodityParameterN = '002' THEN 'FSSAI'
                            WHEN P.CommodityParameterN = '003' THEN 'Drug'
                        END AS Name
                    FROM CATAGORY_PARAMETER P
                    WHERE P.CommodityParameterN IS NOT NULL
                    GROUP BY P.CommodityParameterN
                    ORDER BY P.CommodityParameterN;
                ";


                return await connection.QueryAsync<Verticals>(query);
            }
        }

        public async Task<IEnumerable<Regulations>> GetRegulationsAsync()
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var query = @"
                    SELECT DISTINCT
                        R.RegulationCode AS Code,
                        R.RegulationName AS Name
                    FROM Regulation R
                    WHERE R.RegulationCode IS NOT NULL AND R.RegulationName IS NOT NULL AND R.RegulationName != '-'
                    ORDER BY R.RegulationCode;
                ";


                return await connection.QueryAsync<Regulations>(query);
            }
        }

    }
}
