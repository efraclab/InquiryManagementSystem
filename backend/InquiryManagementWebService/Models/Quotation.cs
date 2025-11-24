namespace InquiryManagementWebService.Models
{
    public class Quotation
    {
        public string? QuotNo { get; set; }
        public DateTime? QuotDate { get; set; }
        public int? QuotValBeforeDis { get; set; }
        public int? QuotValAfterDis { get; set; }
        public int? QuotAgeing { get; set; }
        public int? PercOfDis { get; set; }
        public int BdCode { get; set; }
        public string Vertical { get; set; }
        public string BDName { get; set; }
        public string ClientCode { get; set; }
        public string ClientName { get; set; }
        public string ClientCity { get; set; }
        public string ClientAddress { get; set; }
        public string? ClientUnit { get; set; }
        public string SampleName { get; set; }
        public string IsLive { get; set; }
        public string ClosingRemarks { get; set; }
    }
}
