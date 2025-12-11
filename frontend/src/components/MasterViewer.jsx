import { useState, useEffect, useRef } from "react";
import * as XLSX from 'xlsx';
import {
  Search,
  Filter,
  ChevronDown,
  Loader2,
  FileText,
  Beaker,
  Building2,
  Shield,
  ChevronLeft,
  ChevronRight,
  Package,
  Grid3x3,
  AlertCircle,
  X,
  ArrowLeft,
  Layers,
} from "lucide-react";
import {
  fetchCommodityDetails,
  fetchCommodityOptions,
  fetchCommodityGroupOptions,
  fetchLabOptions,
  fetchRegulationOptions,
  fetchVerticalOptions,
  buildCommodityRequest,
} from "../services/MasterService";

const CustomDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  label,
  icon: Icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.code === value);
  const displayValue = selectedOption ? selectedOption.name : "";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase()) ||
    opt.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (code) => {
    onChange(code);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative group ${
        disabled ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-blue-600" />
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          readOnly
          className={`w-full px-4 py-2.5 text-sm border rounded-lg transition-all duration-300 placeholder-gray-400 cursor-pointer
            ${
              disabled
                ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                : value
                ? "bg-blue-50/50 border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                : "bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            }`}
          placeholder={placeholder}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-all duration-300 pointer-events-none ${
              isOpen ? "rotate-180 text-blue-500" : ""
            }`}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-blue-200 rounded-lg shadow-xl overflow-hidden animate-slideDown">
          <div className="p-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 rounded-md text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.code}
                  onClick={() => handleSelect(option.code)}
                  className="px-4 py-2.5 text-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 cursor-pointer transition-all duration-200 text-gray-700 hover:text-blue-700 border-b border-gray-50 last:border-0 flex items-center justify-between"
                >
                  <span className="font-medium">{option.name}</span>
                  <span className="text-xs text-gray-400 font-mono">
                    {option.code}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function MasterViewer() {
  const [filters, setFilters] = useState({
    commodity: "",
    commodityGroup: "",
    regulation: "",
    vertical: "",
    searchFilter: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState(filters.searchFilter);
  const [isExporting, setIsExporting] = useState(false);
  const [commodityData, setCommodityData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 100,
    hasMore: true,
  });
  const [totalCount, setTotalCount] = useState(0);

  const [commodityOptions, setCommodityOptions] = useState([]);
  const [commodityGroupOptions, setCommodityGroupOptions] = useState([]);
  const [labOptions, setLabOptions] = useState([]);
  const [regulationOptions, setRegulationOptions] = useState([]);
  const [verticalOptions, setVerticalOptions] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingCommodities, setIsLoadingCommodities] = useState(false);

  useEffect(() => {
    loadDropdownOptions();
  }, []);

  const loadDropdownOptions = async () => {
    setIsLoadingOptions(true);
    try {
      const [commodities, commodityGroups, labs, regulations, verticals] =
        await Promise.all([
          fetchCommodityOptions(filters.commodityGroup),
          fetchCommodityGroupOptions(),
          fetchLabOptions(),
          fetchRegulationOptions(),
          fetchVerticalOptions(),
        ]);

      setCommodityOptions(commodities);
      setCommodityGroupOptions(commodityGroups);
      setLabOptions(labs);
      setRegulationOptions(regulations);
      setVerticalOptions(verticals);
    } catch (error) {
      console.error("Error loading dropdown options:", error);
      setError("Failed to load dropdown options. Please refresh the page.");
    } finally {
      setIsLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadCommodityOptions();
  }, [filters.commodityGroup]);

  const loadCommodityOptions = async () => {
    setIsLoadingCommodities(true);
    try {
      const commodities = await fetchCommodityOptions(filters.commodityGroup);
      setCommodityOptions(commodities);
    } catch (error) {
      console.error("Error loading commodity options:", error);
      setError("Failed to load commodity options. Please try again.");
      setCommodityOptions([]);
    } finally {
      setIsLoadingCommodities(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.searchFilter);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.searchFilter]);

  useEffect(() => {
    if (!isLoadingOptions) {
      fetchData();
    }
  }, [
    filters.commodity,
    filters.commodityGroup,
    filters.regulation,
    filters.vertical,
    debouncedSearch,
    pagination.pageNumber,
    isLoadingOptions,
  ]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const request = buildCommodityRequest(
        { ...filters, searchFilter: debouncedSearch },
        pagination.pageNumber,
        pagination.pageSize
      );

      console.log("Fetching data with request:", request);

      const response = await fetchCommodityDetails(request);

      setCommodityData(response.data || []);
      setTotalCount(response.count || 0);

      const totalPages = Math.ceil((response.count || 0) / pagination.pageSize);
      const hasMoreData = pagination.pageNumber < totalPages;

      setPagination((prev) => ({
        ...prev,
        hasMore: hasMoreData,
      }));
    } catch (error) {
      console.error("Error fetching commodity data:", error);
      setError("Failed to load data. Please try again.");
      setCommodityData([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pagination.pageSize);

  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [filterKey]: value };

      if (filterKey === "commodityGroup") {
        newFilters.commodity = "";
      }

      return newFilters;
    });
    setPagination((prev) => ({ ...prev, pageNumber: 1 }));
  };

  const handleSearchChange = (value) => {
    setFilters((prev) => ({ ...prev, searchFilter: value }));
    setPagination((prev) => ({ ...prev, pageNumber: 1 }));
  };

  const handleClearSearch = () => {
    setFilters((prev) => ({ ...prev, searchFilter: "" }));
    setPagination((prev) => ({ ...prev, pageNumber: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      (newPage < pagination.pageNumber || pagination.hasMore)
    ) {
      setPagination((prev) => ({ ...prev, pageNumber: newPage }));
    }
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const exportRequest = buildCommodityRequest(
        { ...filters, searchFilter: debouncedSearch },
        null,
        null
      );

      console.log("Exporting data with request:", exportRequest);

      const response = await fetchCommodityDetails(exportRequest);
      const exportData = response.data || [];

      if (exportData.length === 0) {
        alert("No data to export");
        return;
      }

      const excelData = exportData.map((item, index) => ({
        "#": index + 1,
        "Commodity Name": item.commodityName,
        "Commodity Code": item.commodityCode,
        "Commodity Group Name": item.commodityGroupName,
        "Commodity Group Code": item.commodityGroupCode,
        "Parameter Name": item.parameterName,
        "Parameter Code": item.parameterCode,
        "Parameter Group Name": item.parameterGroupName,
        "Parameter Group Code": item.parameterGroupCode,
        "TAT (Days)": item.tat,
        "Lab Name": item.labName,
        "Lab Code": item.labCode,
        "Regulation Name": item.regulationName,
        "Regulation Code": item.regulationCode,
        "Vertical Name": item.verticalName,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Commodity Details");

      const columnWidths = Object.keys(excelData[0] || {}).map((key) => ({
        wch: Math.max(
          key.length,
          ...excelData.map((row) => String(row[key] || "").length)
        ) + 2,
      }));
      worksheet["!cols"] = columnWidths;

      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          fill: {
            fgColor: { rgb: "3B82F6" }
          },
          font: {
            color: { rgb: "FFFFFF" },
            bold: true,
            sz: 12
          },
          alignment: {
            horizontal: "center",
            vertical: "center"
          }
        };
      }

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `Commodity_Details_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== "searchFilter" && Boolean(value)
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-slideDown { animation: slideDown 0.25s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: linear-gradient(to bottom, #3b82f6, #2563eb);
          border-radius: 3px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: linear-gradient(to bottom, #2563eb, #1d4ed8);
        }
        .table-row-hover {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .table-row-hover:hover {
          background: linear-gradient(to right, #eff6ff, #dbeafe);
          transform: translateX(2px);
        }
      `}</style>

      <div className="rounded-2xl max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="bg-white border border-slate-200/80 rounded-xl shadow-xl">
            <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-8 py-8 rounded-t-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
              <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
                    <Grid3x3 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                      Master Analysis
                    </h1>
                    <p className="text-blue-100 text-sm mt-1.5">
                      Comprehensive commodity and parameter management
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar Section */}
            <div className="p-6 bg-gradient-to-b from-white to-slate-50/30 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center border border-blue-100">
                  <Search className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-base font-bold text-slate-800">Search</h2>
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Search className="w-5 h-5 text-blue-500 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  type="text"
                  value={filters.searchFilter}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by commodity, parameter, lab, regulation..."
                  className="w-full pl-12 pr-12 py-3.5 text-sm border-2 border-slate-200 rounded-xl transition-all duration-300 placeholder-gray-400
                    bg-white focus:bg-blue-50/30 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100
                    hover:border-blue-300"
                />
                {filters.searchFilter && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full transition-colors group"
                  >
                    <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Section */}
            <div className="p-6 bg-gradient-to-b from-slate-50/50 to-white rounded-b-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center border border-blue-100">
                  <Filter className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-base font-bold text-slate-800">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {activeFilterCount} Active
                  </span>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <CustomDropdown
                  label="Commodity Group"
                  icon={Layers}
                  options={commodityGroupOptions}
                  value={filters.commodityGroup}
                  onChange={(val) => handleFilterChange("commodityGroup", val)}
                  placeholder="Select commodity group..."
                  disabled={isLoadingOptions}
                />

                <CustomDropdown
                  label="Commodity"
                  icon={Package}
                  options={commodityOptions}
                  value={filters.commodity}
                  onChange={(val) => handleFilterChange("commodity", val)}
                  placeholder={
                    !filters.commodityGroup
                      ? "Select commodity group first..."
                      : isLoadingCommodities
                      ? "Loading commodities..."
                      : "Select commodity..."
                  }
                />

                <CustomDropdown
                  label="Vertical"
                  icon={Building2}
                  options={verticalOptions}
                  value={filters.vertical}
                  onChange={(val) => handleFilterChange("vertical", val)}
                  placeholder="Select vertical..."
                  disabled={isLoadingOptions}
                />

                <CustomDropdown
                  label="Regulation"
                  icon={Shield}
                  options={regulationOptions}
                  value={filters.regulation}
                  onChange={(val) => handleFilterChange("regulation", val)}
                  placeholder="Select regulation..."
                  disabled={isLoadingOptions}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 overflow-hidden animate-fadeIn">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-base font-bold text-slate-800">
                  Commodity Details
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                  <span className="text-xs font-semibold text-blue-700">
                    {totalCount} Total Parameters
                  </span>
                </div>
                <div className="px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
                  <span className="text-xs font-semibold text-blue-700">
                    Page {pagination.pageNumber} of {totalPages || 1}
                  </span>
                </div>
                <button
                  onClick={handleExportToExcel}
                  disabled={isExporting || isLoading || commodityData.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-semibold">Exporting...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-semibold">Export to Excel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-16 text-slate-500">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Loading data...
                </p>
              </div>
            ) : commodityData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-slate-500">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <p className="text-base font-semibold text-slate-700 mb-1">
                  No data found
                </p>
                <p className="text-sm text-slate-500">
                  Try adjusting your filters or search query
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Commodity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Commodity Group
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Parameter
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Parameter Group
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      TAT (Days)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Lab
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Regulation
                    </th>
                    <th className="px-4 py-3 min-w-[50px] text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Vertical
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {commodityData.map((item, index) => (
                    <tr key={index} className="table-row-hover">
                      <td className="px-4 py-3 text-sm text-slate-500 font-medium">
                        {(pagination.pageNumber - 1) * pagination.pageSize +
                          index +
                          1}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {item.commodityName}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {item.commodityCode}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {item.commodityGroupName}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {item.commodityGroupCode}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-blue-700">
                            {item.parameterName}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {item.parameterCode}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {item.parameterGroupName}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {item.parameterGroupCode}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-700">
                            {item.tat}
                          </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-50 to-sky-50 flex items-center justify-center border border-blue-100">
                            <Beaker className="w-3.5 h-3.5 text-sky-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {item.labName}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">
                              {item.labCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
                          <Shield className="w-3 h-3" />
                          {item.regulationName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center min-w-[100px] gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700">
                          <Building2 className="w-3 h-3" />
                          {item.verticalName}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && commodityData.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {(pagination.pageNumber - 1) * pagination.pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-800">
                    {Math.min(
                      pagination.pageNumber * pagination.pageSize,
                      totalCount
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-emerald-700">
                    {totalCount}
                  </span>{" "}
                  parameters
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.pageNumber - 1)}
                    disabled={pagination.pageNumber === 1}
                    className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-600">
                      Previous
                    </span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {pagination.pageNumber > 2 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200 text-sm font-medium text-slate-600"
                        >
                          1
                        </button>
                        {pagination.pageNumber > 3 && (
                          <span className="px-2 text-slate-400">...</span>
                        )}
                      </>
                    )}

                    {pagination.pageNumber > 1 && (
                      <button
                        onClick={() =>
                          handlePageChange(pagination.pageNumber - 1)
                        }
                        className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200 text-sm font-medium text-slate-600"
                      >
                        {pagination.pageNumber - 1}
                      </button>
                    )}

                    <div className="px-4 py-2 bg-emerald-50 border-2 border-blue-200 rounded-lg">
                      <span className="text-sm font-bold text-blue-700">
                        {pagination.pageNumber}
                      </span>
                    </div>

                    {pagination.pageNumber < totalPages && (
                      <button
                        onClick={() =>
                          handlePageChange(pagination.pageNumber + 1)
                        }
                        className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200 text-sm font-medium text-slate-600"
                      >
                        {pagination.pageNumber + 1}
                      </button>
                    )}

                    {pagination.pageNumber < totalPages - 1 && (
                      <>
                        {pagination.pageNumber < totalPages - 2 && (
                          <span className="px-2 text-slate-400">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200 text-sm font-medium text-slate-600"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.pageNumber + 1)}
                    disabled={!pagination.hasMore}
                    className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    <span className="text-sm font-medium text-slate-600">
                      Next
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
