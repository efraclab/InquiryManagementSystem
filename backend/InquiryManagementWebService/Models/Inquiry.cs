namespace InquiryManagementWebService.Models
{
    public class Inquiry
    {
        public string InqNo { get; set; }
        public DateTime InqDate { get; set; }
        public string? QuotNo { get; set; }
        public DateTime? QuotDate { get; set; }
        public int? QuotValBeforeDis { get; set; }
        public int? QuotValAfterDis { get; set; }
        public int? QuotAgeing { get; set; }
        public string QuotStatus { get; set; }
        public int? PercOfDis { get; set; }
        public string? RegisNo { get; set; }
        public DateTime? RegisDate { get; set; }
        public string? RegisVal { get; set; }
        public int BdCode { get; set; }
        public string Vertical { get; set; }
        public string BDName { get; set; }
        public string ClientCode { get; set; }
        public string ClientName { get; set; }
        public string ClientCity { get; set; }
        public DateTime? TatDate { get; set; }
        public string? ReportStatus { get; set; }

    }
}
