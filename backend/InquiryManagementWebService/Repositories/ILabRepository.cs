using InquiryManagementWebService.Models;

namespace InquiryManagementWebService.Repositories
{
    public interface ILabRepository
    {
        Task<SampleOverview> GetSampleOverviewAsync(SampleSummaryRequest request);
        Task<IEnumerable<SampleSummary>> GetSampleSummaryAsync(SampleSummaryRequest request);
        Task<IEnumerable<LabSummary>> GetLabSummaryAsync(SampleSummaryRequest request);
        Task<IEnumerable<string>> GetLabsAsync(SampleSummaryRequest request);
        Task<IEnumerable<SampleDetails>> GetSampleDetailsByIdAsync(string regNo);
        Task<IEnumerable<SampleDetails>> GetPendingParametersFromQAAsync(ParameterRequest request);
        Task<IEnumerable<LabParameterOverview>> GetPendingParametersOverviewFromQAAsync(ParameterRequest request);

    }
}