import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Calendar,
  Search,
  RefreshCcw,
  Filter,
  Clock,
  FlaskConical,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Microscope,
  TestTube2,
  ListFilter,
  User,
  Hash,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  getLabNames,
  getPendingParametersQA,
  getPendingParametersOverviewQA, // Imported API
} from "../services/api";
import { HiHashtag } from "react-icons/hi2";
import { FaHashtag } from "react-icons/fa6";

// --- Helper Functions ---

function parseDate(dateString) {
  if (!dateString) return null;
  // Handle "dd/mm/yyyy" or "dd/mm/yyyy HH:mm:ss"
  const parts = dateString.split(" ");
  const dateParts = parts[0].split("/");
  if (dateParts.length === 3) {
    // Return standard Date object (month is 0-indexed)
    return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
  }
  return new Date(dateString);
}

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = parseDate(dateString);
    if (!date || isNaN(date.getTime())) return dateString; // Fallback to original string
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return dateString;
  }
}

// --- Reusable UI Components ---

const MultiSelectDropdown = ({
  options,
  selected,
  onToggle,
  label,
  icon: Icon,
  onSelectAll,
  onDeselectAll,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = React.useRef(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = selected.length;
  const displayValue =
    count === 0
      ? `Select ${label}`
      : count === options.length
      ? `All ${label}`
      : `${count} ${label} Selected`;

  const handleItemToggle = (value) => {
    const updatedSelection = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onToggle(updatedSelection);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className={`w-full bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 text-sm font-medium flex items-center justify-between group cursor-pointer
          ${disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-md"}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
          <span className="text-gray-700">{displayValue}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-2 w-full rounded-xl bg-white shadow-xl ring-1 ring-gray-200 overflow-hidden border border-gray-100">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${label}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto custom-scrollbar">
            <div className="flex border-b border-gray-100">
              {onSelectAll && (
                <button
                  className="flex-1 px-4 py-2.5 text-xs font-semibold hover:bg-blue-50 text-blue-600 transition-colors text-left"
                  onClick={onSelectAll}
                >
                  Select All
                </button>
              )}
              {onDeselectAll && (
                <button
                  className="flex-1 px-4 py-2.5 text-xs font-semibold hover:bg-red-50 text-red-600 transition-colors text-right"
                  onClick={onDeselectAll}
                >
                  Clear
                </button>
              )}
            </div>

            {filteredOptions.map((option) => (
              <li
                key={option.value}
                className={`px-4 py-2.5 text-sm flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                  selected.includes(option.value)
                    ? "bg-blue-50 text-blue-800 font-medium"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
                onClick={() => handleItemToggle(option.value)}
              >
                {option.label}
                {selected.includes(option.value) && (
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                )}
              </li>
            ))}
            {filteredOptions.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-500 italic text-center">
                No matches found.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const DateRangePicker = ({ fromDate, toDate, onChange }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1.5">
          From Date
        </label>
        <div className="relative">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onChange({ fromDate: e.target.value, toDate })}
            className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 text-gray-700 pl-10"
          />
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1.5">
          To Date
        </label>
        <div className="relative">
          <input
            type="date"
            value={toDate}
            onChange={(e) => onChange({ fromDate, toDate: e.target.value })}
            className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 text-gray-700 pl-10"
          />
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

const FilterPanel = ({ filters, setFilters, labOptions, onClear }) => {
  const { fromDate, toDate, selectedLabs } = filters;

  const handleLabToggle = (labList) => {
    setFilters((prev) => ({ ...prev, selectedLabs: labList }));
  };

  const handleSelectAllLabs = () => {
    setFilters((prev) => ({
      ...prev,
      selectedLabs: labOptions.map((l) => l.value),
    }));
  };

  const handleDeselectAllLabs = () => {
    setFilters((prev) => ({ ...prev, selectedLabs: [] }));
  };

  const handleClearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    setFilters({
      fromDate: today,
      toDate: today,
      selectedLabs: [],
    });
    // Call the parent's onClear, which will trigger a re-fetch
    if (onClear) onClear();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md">
          <Filter className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Analysis Filters</h2>
          <p className="text-xs text-gray-500">
            Filter pending parameters by date and lab
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        {/* Date Filter */}
        <div className="lg:col-span-5">
          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            onChange={({ fromDate, toDate }) => {
              // Live filter: updates state directly, which triggers useEffect in parent
              setFilters((prev) => ({ ...prev, fromDate, toDate }));
            }}
          />
        </div>

        {/* Lab Selection */}
        <div className="lg:col-span-4">
          <label className="text-xs font-medium text-gray-600 block mb-1.5">
            Lab Selection
          </label>
          <MultiSelectDropdown
            options={labOptions}
            selected={selectedLabs}
            onToggle={handleLabToggle} // Live filter: updates state directly
            label="Labs"
            icon={FlaskConical}
            onSelectAll={handleSelectAllLabs}
            onDeselectAll={handleDeselectAllLabs}
          />
        </div>

        {/* Actions - Only Reset remains */}
        <div className="lg:col-span-3 flex justify-end gap-3">
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 text-sm px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Custom Loader and Empty States ---

const AppLoader = ({ message }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col justify-center items-center py-20 bg-white rounded-2xl shadow-xl border border-blue-100"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="p-3 rounded-full bg-blue-50/70 mb-4"
    >
      <Microscope className="w-10 h-10 text-blue-600" />
    </motion.div>
    <span className="text-xl font-bold text-gray-700">{message}</span>
    <span className="text-sm text-blue-400 mt-1">
      Fetching latest QA metrics...
    </span>
  </motion.div>
);

const NoDataFound = () => (
  <div className="flex flex-col justify-center items-center py-20 bg-white rounded-xl shadow-lg border border-gray-200">
    <div className="flex flex-col items-center">
      <div className="relative mb-6 w-20 h-20">
        <Search className="w-16 h-16 text-gray-300 absolute top-0 left-0" />
        <XCircle className="w-8 h-8 text-red-500 absolute bottom-0 right-0 p-1 bg-white rounded-full border-2 border-white" />
      </div>
      <span className="text-xl font-medium text-gray-600">No Data Found</span>
      <span className="text-sm text-gray-400 mt-2 max-w-md text-center">
        We couldn’t find any data matching your filters. Try adjusting your
        filter selection.
      </span>
    </div>
  </div>
);

const DetailedLoader = ({ labName }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex justify-center items-center py-8 bg-blue-50/50"
  >
    <Loader2 className="w-5 h-5 text-blue-700 animate-spin mr-3" />
    <span className="text-sm text-blue-700 font-medium">
      Fetching detailed parameters for {labName}...
    </span>
  </motion.div>
);

// --- Parameters Table Component (Updated for efficiency) ---
const ParametersTable = ({ parameters }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-blue-500/10 text-blue-900 font-medium border-b border-blue-100">
          <tr>
            <th className="px-4 py-3">
              <FaHashtag className="w-3.5 h-3.5"/>
            </th>
            <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide min-w-[150px]">
              Reg. No.
            </th>
            <th className="px-4 py-3 text-xs font-extrabold uppercase tracking-wide min-w-[250px]">
              Sample & Parameter
            </th>
            <th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wide min-w-[180px]">
              Reg. Date & Comp. Date
            </th>
            <th className="px-4 py-3 text-center text-xs font-extrabold uppercase tracking-wide min-w-[120px]">
              TAT Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {parameters.map((param, idx) => (
            <tr
              key={`${param.registrationNo}-${param.parameter}-${idx}`}
              className="hover:bg-blue-50/30 transition-colors"
            >
              <td className="px-4 py-3 text-center text-gray-500 font-medium whitespace-nowrap">
                {idx + 1}
              </td>
              <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                {param.registrationNo}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-gray-800 leading-snug">
                  {param.parameter}
                </p>
                <p className="text-xs text-gray-500 leading-snug mt-0.5">
                  Sample: {param.sampleName}
                </p>
              </td>
              <td className="px-4 py-3 text-center">
                <p className="text-gray-600 font-medium leading-snug">
                  Reg: {formatDate(param.registrationDate)}
                </p>
                <p className="text-xs text-green-700 leading-snug mt-0.5 font-medium">
                  Comp: {formatDate(param.analysisCompletionDateTime)}
                </p>
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                <span className="inline-flex items-center justify-center w-full gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 shadow-sm">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  {formatDate(param.tatDate)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- LabGroup Component ---
const LabGroup = ({ labName, parameterCount, filters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [parameters, setParameters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Clear parameters if filters change while collapsed, forcing a reload on next expand
  useEffect(() => {
    if (!isExpanded) {
      setParameters([]);
    }
  }, [filters, isExpanded]);

  const fetchDetailedParameters = useCallback(async () => {
    // Check if data is already present and filters haven't changed since it was fetched
    if (!isExpanded || parameters.length > 0) return;

    setIsLoading(true);
    try {
      // API call uses the existing filters + the specific lab name
      const payload = {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        // Send only the current labName in a list to the existing API
        labs: [labName],
      };

      const response = await getPendingParametersQA(payload);
      setParameters(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error(`Failed to fetch parameters for ${labName}`, error);
      setParameters([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    isExpanded,
    labName,
    filters.fromDate,
    filters.toDate,
    parameters.length,
  ]);

  // Effect to fetch data when expanded state changes AND we don't have data
  useEffect(() => {
    if (isExpanded && parameters.length === 0) {
      fetchDetailedParameters();
    }
  }, [isExpanded, fetchDetailedParameters, parameters.length]);

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  // Memoize parameters and loading state
  const content = useMemo(() => {
    if (isLoading && isExpanded) {
      return <DetailedLoader labName={labName} />;
    }

    if (isExpanded && parameters.length > 0) {
      return (
        <>
          <div className="border-t border-gray-100 hidden lg:block">
            <ParametersTable parameters={parameters} />
          </div>
          {/* Mobile View for Parameters - Simplified for efficiency */}
          <div className="lg:hidden p-4 space-y-3 bg-gray-50 border-t border-gray-100">
            {parameters.map((param, i) => (
              <div
                key={i}
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">
                    Reg. No: {param.registrationNo}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    TAT: {formatDate(param.tatDate)}
                  </span>
                </div>
                <div className="text-sm text-blue-700 font-medium mb-1">
                  {param.parameter}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Sample: {param.sampleName}
                </div>
                <div className="flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
                  <span>Reg: {formatDate(param.registrationDate)}</span>
                  <span className="text-green-700 font-medium">
                    Comp: {formatDate(param.analysisCompletionDateTime)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (
      isExpanded &&
      parameterCount > 0 &&
      parameters.length === 0 &&
      !isLoading
    ) {
      return (
        <div className="flex justify-center items-center py-8">
          <AlertCircle className="w-5 h-5 text-orange-500 mr-3" />
          <span className="text-gray-500 text-sm">
            Detailed data not available or may be out of sync.
          </span>
        </div>
      );
    }

    return null;
  }, [isLoading, isExpanded, parameters, parameterCount, labName]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-4"
    >
      {/* Lab Header - Blue Gradient */}
      <div
        onClick={handleToggle}
        className={`px-6 py-4 cursor-pointer transition-colors duration-200 flex items-center justify-between
          bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700`}
      >
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white shadow-inner">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {labName || "Unknown Lab"}
            </h3>
            <p className="text-xs text-blue-100 mt-0.5">
              Click to view {parameterCount} pending details
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-1 rounded-full bg-white text-blue-700 text-sm font-bold shadow-lg min-w-[40px] text-center">
            {parameterCount}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-white/80" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Main Component ---

export default function QAAnalysis({ username, designation }) {
  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    selectedLabs: [],
  });

  const [labOptions, setLabOptions] = useState([]);
  const [overviewData, setOverviewData] = useState([]);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [isFetchingLabs, setIsFetchingLabs] = useState(true);

  // State to hold the most recently applied filters for the child components to use
  const [appliedFilters, setAppliedFilters] = useState(filters);

  // Fetch Lab Names on Mount
  useEffect(() => {
    const fetchLabs = async () => {
      setIsFetchingLabs(true);
      try {
        const response = await getLabNames({});
        let formattedLabs = [];
        if (Array.isArray(response)) {
          formattedLabs = response.map((lab) => {
            // Assume lab is {name: string, id: string} or just a string
            if (typeof lab === "string") return { value: lab, label: lab };
            return { value: lab.name || lab.id, label: lab.name || lab.label };
          });
        }
        setLabOptions(formattedLabs);
      } catch (error) {
        console.error("Failed to fetch lab names", error);
      } finally {
        setIsFetchingLabs(false);
      }
    };
    fetchLabs();
  }, []);

  // Fetch Overview Data (Memoized function)
  const fetchOverviewData = useCallback(async (filtersToApply) => {
    setIsLoadingOverview(true);
    setAppliedFilters(filtersToApply); // Update applied filters state before fetch

    try {
      const payload = {
        fromDate: filtersToApply.fromDate,
        toDate: filtersToApply.toDate,
        labs:
          filtersToApply.selectedLabs.length > 0
            ? filtersToApply.selectedLabs
            : undefined,
      };

      // Call the new overview API
      const response = await getPendingParametersOverviewQA(payload);
      setOverviewData(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to fetch QA parameters overview", error);
      setOverviewData([]);
    } finally {
      setIsLoadingOverview(false);
    }
  }, []);

  // Effect to trigger data fetch whenever the filter state changes (Live Filter)
  useEffect(() => {
    // Debounce logic to prevent excessive API calls when quickly changing filters
    const handler = setTimeout(() => {
      fetchOverviewData(filters);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [filters, fetchOverviewData]);

  // Function to handle reset (will trigger the useEffect above)
  const handleClearFilters = () => {
    const today = new Date().toISOString().split("T")[0];
    // Setting filters here will trigger the useEffect, which calls fetchOverviewData
    setFilters({ fromDate: today, toDate: today, selectedLabs: [] });
  };

  // Sorting the overview data by lab name
  const sortedOverviewData = useMemo(() => {
    // Filter out labs with 0 count if you want a cleaner look, though keeping them is generally better
    return overviewData
      .filter((item) => item.parameterCount > 0)
      .sort((a, b) => a.labName.localeCompare(b.labName));
  }, [overviewData]);

  // Total parameter count for display
  const totalParameters = useMemo(() => {
    return sortedOverviewData.reduce(
      (sum, item) => sum + item.parameterCount,
      0
    );
  }, [sortedOverviewData]);

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl shadow-2xl mb-8 bg-white border border-gray-200"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 opacity-95"></div>
          <div className="relative p-6 sm:p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="p-3 rounded-xl bg-white/10 backdrop-blur-sm shadow-lg"
              >
                <TestTube2 className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <div className="flex flex-row gap-4">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    QA Analysis
                  </h1>
                  {totalParameters !== 0 && (
                    <div className="hidden md:block">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-white text-xs font-medium backdrop-blur-md border border-white/20">
                        <ListFilter className="w-4 h-4" />
                        <span>{totalParameters} Parameters Pending</span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-blue-100 text-sm mt-1">
                  Track and manage parameters pending in QA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-right flex-shrink-0">
              <div className="text-white">
                <p className="text-lg font-semibold leading-snug">{username}</p>
                <p className="text-blue-200 text-xs font-medium leading-snug">
                  {designation}
                </p>
              </div>
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            labOptions={labOptions}
            onClear={handleClearFilters}
          />
        </motion.div>

        {/* Content */}
        {isLoadingOverview || isFetchingLabs ? (
          <AppLoader message="Loading analysis overview..." />
        ) : sortedOverviewData.length === 0 ? (
          <NoDataFound />
        ) : (
          <div className="space-y-4">
            {sortedOverviewData.map((labData, index) => (
              <LabGroup
                key={labData.labName}
                labName={labData.labName}
                parameterCount={labData.parameterCount}
                // Pass the filters currently being displayed/used
                filters={appliedFilters}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
