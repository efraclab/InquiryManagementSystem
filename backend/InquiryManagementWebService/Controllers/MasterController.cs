using InquiryManagementWebService.Models;
using InquiryManagementWebService.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace InquiryManagementWebService.Controllers
{
    [ApiController]
    [Route("api/master")]
    public class MasterController : ControllerBase
    {
        private readonly IMasterRepository _masterRepository;

        public MasterController(IMasterRepository masterRepository)
        {
            _masterRepository = masterRepository;
        }

        [HttpPost("commodity-details")]
        public async Task<IActionResult> GetCommodityDetails([FromBody] CommodityRequest request)
        {
            var result = await _masterRepository.GetCommodityDetailsAsync(request);
            var rows = await _masterRepository.GetCommodityDetailsCountAsync(request);
            return Ok(new
            {
                count = rows,
                data = result
            });
        }

        [HttpGet("commodities")]
        public async Task<IActionResult> GetCommodities([FromQuery] string? commodityGroupCode)
        {
            var result = await _masterRepository.GetCommoditiesAsync(commodityGroupCode);
            return Ok(result);
        }



        [HttpGet("commodity-groups")]
        public async Task<IActionResult> GetCommodityGroups()
        {
            var result = await _masterRepository.GetCommodityGroupsAsync();
            return Ok(result);
        }

        [HttpGet("labs")]
        public async Task<IActionResult> GetLabs()
        {
            var result = await _masterRepository.GetLabsAsync();
            return Ok(result);
        }

        [HttpGet("verticals")]
        public async Task<IActionResult> GetVerticals()
        {
            var result = await _masterRepository.GetVerticalsAsync();
            return Ok(result);
        }

        [HttpGet("regulations")]
        public async Task<IActionResult> GetRegulations()
        {
            var result = await _masterRepository.GetRegulationsAsync();
            return Ok(result);
        }
    }

}
