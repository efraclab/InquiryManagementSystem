namespace InquiryManagementWebService.Models
{
    public class CommodityRequest
    {
        public string? CommodityCode { get; set; }
        public string? CommodityGroupCode { get; set; }
        public string? LabCode { get; set; }
        public string? VerticalCode { get; set; }
        public string? RegulationCode { get; set; }
        public string? SearchFilter { get; set; }

        public int? PageNumber { get; set; }
        public int? PageSize { get; set; }
    }
}
