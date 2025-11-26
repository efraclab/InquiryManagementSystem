namespace InquiryManagementWebService.Models
{
    public class ParameterRequest
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public List<string>? Labs { get; set; }
    }
}
