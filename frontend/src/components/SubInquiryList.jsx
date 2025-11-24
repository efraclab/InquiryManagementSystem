import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, ChevronDown } from "lucide-react";

// Custom Status Dropdown Component
const StatusDropdown = ({ selected, onSelect, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === selected);
  const displayValue = selectedOption ? selectedOption.label : "All Status";

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-2.5 text-left cursor-pointer hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 text-sm font-medium flex items-center justify-between group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
          <span className="text-gray-700">{displayValue}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full rounded-xl bg-white shadow-xl ring-1 ring-gray-200 overflow-hidden border border-gray-100">
          <ul className="max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isSelected = selected === option.value;
              return (
                <li
                  key={option.value}
                  className={`px-4 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? "bg-blue-50 text-blue-800 font-medium"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                  onClick={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default function SubInquiryList({
  title,
  data = [],
  onBack,
  queryType,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const rowsPerPage = 30;

  useEffect(() => {
    setCurrentPage(1); // reset to first page when dataset changes
  }, [data]);

  // Filter data based on report status
  const filteredData = statusFilter === "all" 
    ? data 
    : data.filter(item => {
        if (statusFilter === "released") return item.reportStatus?.toLowerCase() === "released";
        if (statusFilter === "pending") return item.reportStatus?.toLowerCase() === "pending";
        return true;
      });

  if (!data.length) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 text-center text-gray-600 min-h-screen">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <div className="bg-white p-20 rounded-2xl shadow-xl">
          🚫 No records found
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const PaginationControls = ({
    currentPage,
    totalPages,
    goToPage,
    getPageNumbers,
  }) => {
    return (
      <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-md border border-gray-100">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition duration-150 ease-in-out shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 hidden sm:inline">Page</span>
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span key={index} className="px-2 py-1 text-sm text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  page === currentPage
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {page}
              </button>
            )
          )}
          <span className="text-sm text-gray-600 hidden sm:inline">
            of {totalPages}
          </span>
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition duration-150 ease-in-out shadow-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "released", label: "Released" },
    { value: "pending", label: "Pending" },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-8 animate-fadeIn min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {title} <span className="text-blue-600">({filteredData.length}{statusFilter !== "all" && ` / ${data.length}`})</span>
        </h2>
        <div className="flex gap-3 items-center">
          {queryType === "registrations" && (
            <div className="w-48">
              <StatusDropdown
                selected={statusFilter}
                onSelect={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                options={statusOptions}
              />
            </div>
          )}
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
      </div>

      {/* Pagination Top */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          goToPage={goToPage}
          getPageNumbers={getPageNumbers}
        />
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl shadow-xl border border-gray-200 bg-white my-4">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600">
                {queryType === "inqueries" && (
                  <>
                    <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                      Inquiry No
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                      Inquiry Date
                    </th>
                  </>
                )}
                {queryType !== "registrations" && (
                  <>
                    <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                      Quotation No
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                      Quotation Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                      Quot. Value (Before Disc.)
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                      Quot. Value (After Disc.)
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                      Quot. Ageing
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                      Discount (%)
                    </th>
                  </>
                )}
                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                  Registration No
                </th>
                <th className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                  Regis. Date
                </th>
                <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                  Regis. Value
                </th>
                {queryType === "registrations" && (
                  <>
                    <th className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                      TAT Date
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                      Report Status
                    </th>
                  </>
                )}
                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">BD Name</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-white whitespace-nowrap">
                  Client Name
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((inq, idx) => {
                const globalIndex = (currentPage - 1) * rowsPerPage + idx;
                return (
                  <tr
                    key={`${inq.inqNo}-${idx}`}
                    className={`transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:shadow-md ${
                      globalIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    {queryType === "inqueries" && (
                      <>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">{inq.inqNo ?? "-"}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-700 font-medium">
                            {inq.inqDate
                              ? new Date(inq.inqDate).toLocaleDateString()
                              : "-"}
                          </span>
                        </td>
                      </>
                    )}
                    {queryType !== "registrations" && (
                      <>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">{inq.quotNo ?? "-"}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-700 font-medium">
                            {inq.quotDate
                              ? new Date(inq.quotDate).toLocaleDateString()
                              : "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {Math.round(inq.quotValBeforeDis) ?? "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {Math.round(inq.quotValAfterDis) ?? "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-700">{inq.quotAgeing ?? "-"}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-700">{inq.percOfDis ?? "-"}</span>
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{inq.regisNo ?? "-"}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-700 font-medium">
                        {inq.regisDate
                          ? new Date(inq.regisDate).toLocaleDateString()
                          : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-green-700">
                        {Math.round(inq.regisVal) ?? "-"}
                      </span>
                    </td>
                    {queryType === "registrations" && (
                      <>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-700 font-medium">
                            {inq.tatDate
                              ? new Date(inq.tatDate).toLocaleDateString()
                              : "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                            inq.reportStatus?.toLowerCase() === "released"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : inq.reportStatus?.toLowerCase() === "pending"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}>
                            {inq.reportStatus ?? "-"}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{inq.bdName ?? "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{inq.clientName ?? "-"}</span>
                        {inq.clientCity && (
                          <span className="text-xs text-gray-500 mt-0.5">{inq.clientCity}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bottom */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          goToPage={goToPage}
          getPageNumbers={getPageNumbers}
        />
      )}
    </div>
  );
}