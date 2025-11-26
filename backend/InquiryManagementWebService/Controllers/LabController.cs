using InquiryManagementWebService.Models;
using InquiryManagementWebService.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace InquiryManagementWebService.Controllers
{
    [Route("api/lab")]
    [ApiController]
    public class LabController : Controller
    {
        private readonly ILabRepository _labRepository;

        public LabController(ILabRepository labRepository)
        {
            _labRepository = labRepository;
        }

        [HttpPost("sample-overview")]
        public async Task<IActionResult> GetSampleOverview([FromBody] SampleSummaryRequest request)
        {
            try
            {
                var response = await _labRepository.GetSampleOverviewAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("samples")]
        public async Task<IActionResult> GetSampleSummary([FromBody] SampleSummaryRequest request)
        {
            try
            {
                var response = await _labRepository.GetSampleSummaryAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("sample-details")]
        public async Task<IActionResult> GetSampleDetailsById([FromBody] string regNo)
        {
            try
            {
                var response = await _labRepository.GetSampleDetailsByIdAsync(regNo);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("pending-parameters-qa")]
        public async Task<IActionResult> GetPendingParametersFromQA([FromBody] ParameterRequest request)
        {
            try
            {
                var response = await _labRepository.GetPendingParametersFromQAAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("pending-parameters-overview-qa")]
        public async Task<IActionResult> GetPendingParametersOverviewFromQA([FromBody] ParameterRequest request)
        {
            try
            {
                var response = await _labRepository.GetPendingParametersOverviewFromQAAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("summaries")]
        public async Task<IActionResult> GetLabSummary([FromBody] SampleSummaryRequest request)
        {
            try
            {
                var response = await _labRepository.GetLabSummaryAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("names")]
        public async Task<IActionResult> GetLabs([FromBody] SampleSummaryRequest request)
        {
            try
            {
                var response = await _labRepository.GetLabsAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

    }
}
