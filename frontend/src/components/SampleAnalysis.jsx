import React, { useState, useCallback, useMemo } from "react";
import { ClipboardList, FlaskConical, Search, TestTube2 } from "lucide-react";

import {
  IoSearch,
  IoDocumentText,
  IoTime,
  IoWarning,
  IoChevronDown,
  IoLayersSharp,
} from "react-icons/io5";
import {
  FaFlask,
  FaMicroscope,
  FaSpinner,
  FaTag,
  FaFlaskVial,
} from "react-icons/fa6";
import { MdCheckCircle, MdPending } from "react-icons/md";
import { HiBeaker, HiCalendar, HiCurrencyRupee } from "react-icons/hi2";

import { getSampleDetailsByRegNo } from "../services/api";

function formatAmount(num) {
  if (num === null || num === undefined) return 0;
  const number = parseFloat(num);
  if (number < 1000) return number.toFixed(0);
  const si = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e5, symbol: "L" },
    { value: 1e7, symbol: "Cr" },
    { value: 1e9, symbol: "B" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (number >= si[i].value) {
      break;
    }
  }
  return (number / si[i].value).toFixed(2).replace(rx, "$1") + si[i].symbol;
}

const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return "N/A";
  try {
    const parts = dateString.split(/[\/ :]/);

    if (parts.length < 3) return dateString;

    const date = new Date(
      parts[2],
      parts[1] - 1,
      parts[0],
      parts[3] || 0,
      parts[4] || 0,
      parts[5] || 0
    );

    if (isNaN(date.getTime())) {
      return dateString;
    }

    const dateOptions = { day: "2-digit", month: "short", year: "numeric" };
    const timeOptions =
      includeTime && parts.length > 3
        ? { hour: "2-digit", minute: "2-digit", hour12: true }
        : {};

    const formattedDate = date.toLocaleDateString("en-GB", dateOptions);
    const formattedTime =
      includeTime && parts.length > 3
        ? " " + date.toLocaleTimeString("en-US", timeOptions)
        : "";

    return formattedDate + formattedTime;
  } catch (e) {
    return dateString;
  }
};

const colorMap = {
  blue: {
    border: "border-t-4 border-blue-500",
    bg: "bg-blue-100",
    icon: "text-blue-600",
    text: "text-blue-700",
    chip: "bg-blue-100 text-blue-800",
  },
  green: {
    border: "border-t-4 border-green-500",
    bg: "bg-green-100",
    icon: "text-green-600",
    text: "text-green-700",
    chip: "bg-green-100 text-green-800",
  },
  red: {
    border: "border-t-4 border-red-500",
    bg: "bg-red-100",
    icon: "text-red-600",
    text: "text-red-700",
    chip: "bg-red-100 text-red-800",
  },
  orange: {
    border: "border-t-4 border-orange-500",
    bg: "bg-orange-100",
    icon: "text-orange-600",
    text: "text-orange-700",
    chip: "bg-orange-100 text-orange-800",
  },
  teal: {
    border: "border-t-4 border-teal-500",
    bg: "bg-teal-100",
    icon: "text-teal-600",
    text: "text-teal-700",
    chip: "bg-teal-100 text-teal-800",
  },
  gray: {
    border: "border-t-4 border-gray-500",
    bg: "bg-gray-100",
    icon: "text-gray-600",
    text: "text-gray-700",
    chip: "bg-gray-100 text-gray-600",
  },
  cyan: {
    border: "border-t-4 border-cyan-500",
    bg: "bg-cyan-100",
    icon: "text-cyan-600",
    text: "text-cyan-700",
    chip: "bg-cyan-100 text-cyan-800",
  },
};

const chipColorMap = {
  green: "bg-green-200 text-green-600",
  red: "bg-red-200 text-red-600",
  gray: "bg-gray-200 text-gray-600",
};

const getCalculatedStatus = (item) => {
  const completionDt = item.analysisCompletionDateTime;
  const mailingDt = item.mailingDate;
  const currentStatus = item.status;

  if (!completionDt) {
    return "Pending from Lab End";
  }
  if (completionDt && !mailingDt) {
    return "Pending from QA End";
  }
  if (currentStatus === "Report Delivered") {
    return "Report Delivered";
  }

  if (mailingDt) {
    return "Report Released";
  }

  return currentStatus || "PENDING";
};

const getLabStatusBadge = (status) => {
  const text = status;

  const isDelivered = text === "Report Delivered";
  const isPendingQA = text === "Pending from QA End";
  const isPendingLab = text === "Pending from Lab End";

  const color = isDelivered
    ? "bg-green-500 text-white"
    : isPendingQA
    ? "bg-amber-500 text-white"
    : isPendingLab
    ? "bg-red-500 text-white"
    : "bg-slate-400 text-white";

  const icon = isDelivered ? (
    <MdCheckCircle className="w-3.5 h-3.5" />
  ) : isPendingQA ? (
    <MdPending className="w-3.5 h-3.5" />
  ) : isPendingLab ? (
    <IoTime className="w-3.5 h-3.5" />
  ) : (
    <FaTag className="w-3.5 h-3.5" />
  );

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm ${color}`}
    >
      {icon}
      {text}
    </span>
  );
};

const getParameterStatusBadge = (item) => {
  const calculatedStatus = getCalculatedStatus(item);
  const text = calculatedStatus;

  const isDelivered = text === "Report Delivered";
  const isPendingQA = text === "Pending from QA End";
  const isPendingLab = text === "Pending from Lab End";
  const isNotReleased = text === "Report not Released";

  const color = isDelivered
    ? "bg-green-500 text-white"
    : isPendingQA
    ? "bg-amber-500 text-white"
    : isPendingLab
    ? "bg-red-500 text-white"
    : "bg-slate-400 text-white";

  const icon = isDelivered ? (
    <MdCheckCircle className="w-3.5 h-3.5" />
  ) : isPendingQA || isNotReleased ? (
    <MdPending className="w-3.5 h-3.5" />
  ) : (
    <IoTime className="w-3.5 h-3.5" />
  );

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shadow-sm ${color}`}
    >
      {icon}
      {text}
    </span>
  );
};

// MODIFIED: Chip rendering logic updated to use chip.statusColor
const SummaryCard = ({
  title,
  value = null,
  color = "gray",
  icon,
  chips = [],
  className = "",
}) => {
  const colorClasses = colorMap[color] || colorMap.gray;
  const MAX_CHIPS = 6;

  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${colorClasses.border} ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase text-gray-500">
          {title}
        </span>
        <div
          className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.icon}`}
        >
          {icon}
        </div>
      </div>

      {/* Conditionally render value: only render if value is explicitly passed and not null */}
      {value !== null && (
        <p className={`text-3xl mt-6 font-extrabold ${colorClasses.text} mb-2`}>
          {value}
        </p>
      )}

      {/* Display Chips for Lab Names */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 max-h-24 overflow-hidden">
          {chips.slice(0, MAX_CHIPS).map((chip, index) => (
            <span
              key={index}
              className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${
                chipColorMap[chip.statusColor] || chipColorMap.gray
              }`}
            >
              {chip.name}
            </span>
          ))}
          {chips.length > MAX_CHIPS && (
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${chipColorMap.gray} opacity-70 whitespace-nowrap`}
            >
              +{chips.length - MAX_CHIPS} more
            </span>
          )}
        </div>
      )}

      {value === null && chips.length > 0 && <div className="h-2"></div>}
    </div>
  );
};

const SampleDetailsCard = ({ data }) => {
  if (!data || data.length === 0) return null;

  const registrationNo = data[0].registrationNo || "";

  const sampleName =
    data.find((item) => item.sampleName && item.sampleName.trim())
      ?.sampleName || "N/A";

  const registrationDate =
    data.find((item) => item.registrationDate)?.registrationDate || null;

  // ---------- SAFE PARSER (handles DD/MM/YYYY & DD/MM/YYYY HH:mm:ss) ----------
  const parseDate = (str) => {
    if (!str || typeof str !== "string") return null;

    const parts = str.split(/[\/ :]/);

    if (parts.length < 3) return null;

    const [day, month, year] = parts;

    const hour = parts[3] || 0;
    const minute = parts[4] || 0;
    const second = parts[5] || 0;

    const date = new Date(year, month - 1, day, hour, minute, second);

    return isNaN(date.getTime()) ? null : date;
  };

  // ---------- PICK BIGGEST TAT DATE (SAFE) ----------
  const tatDate = (() => {
    const allDates = data
      .map((item) => parseDate(item.tatDate))
      .filter((d) => d && !isNaN(d));

    if (allDates.length === 0) return null;

    return new Date(Math.max(...allDates.map((d) => d.getTime())));
  })();

  // ---------- FORMATTER (ALWAYS RETURNS STRING, NEVER A DATE) ----------
  const formatDate = (date, includeTime = false) => {
    if (!date || isNaN(date)) return "N/A";

    const dateOptions = { day: "2-digit", month: "short", year: "numeric" };
    const timeOptions = includeTime
      ? { hour: "2-digit", minute: "2-digit", hour12: true }
      : null;

    const result = date.toLocaleDateString("en-GB", dateOptions);

    return includeTime
      ? result + " " + date.toLocaleTimeString("en-US", timeOptions)
      : result;
  };

  const totalRegValue = data.reduce(
    (sum, item) => sum + (parseFloat(item.distributedRegisVal) || 0),
    0
  );

  const details = [
    {
      label: "Registration No",
      value: registrationNo.trim(),
      icon: IoDocumentText,
      color: "text-blue-600",
      widthClass: "lg:col-span-2",
    },
    {
      label: "Sample Name",
      value: sampleName,
      icon: FaFlask,
      color: "text-teal-600",
      widthClass: "lg:col-span-2",
      textClass: "line-clamp-2",
    },
    {
      label: "Reg. Date",
      value: formatDate(parseDate(registrationDate)),
      icon: HiCalendar,
      color: "text-cyan-600",
      widthClass: "lg:col-span-1",
    },
    {
      label: "Tat Date",
      value: formatDate(tatDate),
      icon: HiCalendar,
      color: "text-emerald-600",
      widthClass: "lg:col-span-1",
    },
    {
      label: "Reg. Value",
      value: `₹${totalRegValue.toFixed(2)}`,
      icon: HiCurrencyRupee,
      color: "text-pink-600",
      widthClass: "lg:col-span-1",
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-6 border border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 lg:gap-4">
        {details.map((item, index) => (
          <div
            key={index}
            className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg ${item.widthClass}`}
          >
            <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-gray-500">{item.label}</p>
              <p
                className={`text-sm mt-1 font-semibold text-gray-800 break-words ${
                  item.textClass || ""
                }`}
              >
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const CollapsibleDetails = ({ isExpanded, children }) => (
  <div
    className={`
      transition-all duration-500 ease-in-out
      overflow-hidden 
      ${isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}
    `}
  >
    <div>{children}</div>
  </div>
);

const SampleAnalysisTable = React.memo(
  ({ data, loading, initialSearchDone }) => {
    const [expandedLabs, setExpandedLabs] = useState({});

    const toggleExpansion = (labName) => {
      setExpandedLabs((prev) => ({
        ...prev,
        [labName]: !prev[labName],
      }));
    };

    const groupedData = useMemo(() => {
      return data.reduce((acc, item) => {
        const labName = item.lab || "N/A";
        if (!acc[labName]) {
          acc[labName] = {
            total: 0,
            released: 0,
            pending: 0,
            labRegValue: 0,
            parameters: [],
            overallStatus: "Report Delivered",
            latestCompletionTime: null,
            latestCompletionTimestamp: 0,
          };
        }

        acc[labName].total += 1;
        acc[labName].labRegValue += parseFloat(item.distributedRegisVal) || 0;

        const calculatedStatus = getCalculatedStatus(item);

        if (calculatedStatus === "Pending from Lab End") {
          acc[labName].overallStatus = "Pending from Lab End";
        } else if (
          calculatedStatus === "Pending from QA End" &&
          acc[labName].overallStatus !== "Pending from Lab End"
        ) {
          acc[labName].overallStatus = "Pending from QA End";
        } else if (
          calculatedStatus === "Report Released" &&
          acc[labName].overallStatus === "Report Delivered"
        ) {
          acc[labName].overallStatus = "Report Released";
        }

        const currentCompletionDt = item.analysisCompletionDateTime;
        if (currentCompletionDt) {
          const safeDateString = currentCompletionDt.replace(
            /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/,
            "$3-$2-$1T$4:$5:$6"
          );
          const currentTimestamp = new Date(safeDateString).getTime();

          if (
            !acc[labName].latestCompletionTimestamp ||
            currentTimestamp > acc[labName].latestCompletionTimestamp
          ) {
            acc[labName].latestCompletionTimestamp = currentTimestamp;
            acc[labName].latestCompletionTime = formatDate(
              currentCompletionDt,
              true
            );
          }
        }

        const isReleased = calculatedStatus === "Report Delivered";
        if (isReleased) {
          acc[labName].released += 1;
        } else {
          acc[labName].pending += 1;
        }
        acc[labName].parameters.push(item);
        return acc;
      }, {});
    }, [data]);

    return (
      <div className="mt-8">
        <div className="overflow-hidden rounded-xl shadow-lg hidden lg:block border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-cyan-600">
                  <th className="px-6 py-4 text-left">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-white/90">
                      Laboratory
                    </span>
                  </th>
                  <th className="px-4 py-4 text-center">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-white/90">
                      Parameters
                    </span>
                  </th>
                  <th className="px-4 py-4 text-center">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-white/90">
                      Value
                    </span>
                  </th>
                  <th className="px-4 py-4 text-center">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-white/90">
                      Completion
                    </span>
                  </th>
                  <th className="px-4 py-4 text-center">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-white/90">
                      Status
                    </span>
                  </th>
                  <th className="px-4 py-4 text-center w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(groupedData).map(([labName, labData], idx) => (
                  <React.Fragment key={labName}>
                    {/* Lab Summary Row */}
                    <tr
                      className={`group cursor-pointer transition-all duration-300
                      ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      hover:bg-blue-50`}
                      onClick={() => toggleExpansion(labName)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md group-hover:shadow-lg transition-shadow duration-300">
                            <FaMicroscope className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors duration-300">
                            {labName}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">
                          <IoLayersSharp className="w-3.5 h-3.5" />
                          {labData.total}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-100 text-pink-700 text-xs font-medium">
                          <HiCurrencyRupee className="w-3.5 h-3.5" />
                          {`₹${formatAmount(labData.labRegValue)}`}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                          {labData.latestCompletionTime && (
                            <IoTime className="w-3.5 h-3.5" />
                          )}
                          {labData.latestCompletionTime || "--"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        {getLabStatusBadge(labData.overallStatus)}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <div
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300
                          ${
                            expandedLabs[labName]
                              ? "bg-blue-600 text-white rotate-180"
                              : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                          }`}
                        >
                          <IoChevronDown className="w-4 h-4" />
                        </div>
                      </td>
                    </tr>

                    {/* Parameter Breakdown */}
                    <tr>
                      <td colSpan="6" className="p-0">
                        <CollapsibleDetails isExpanded={expandedLabs[labName]}>
                          <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-t border-blue-200">
                            {/* Header */}
                            <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-600">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <FaFlask className="w-4 h-4 text-white/80" />
                                  <span className="text-sm font-medium text-white">
                                    Parameters
                                  </span>
                                </div>
                                <span className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-xs font-medium text-white">
                                  {labData.parameters.length} items
                                </span>
                              </div>
                            </div>

                            <div className="p-6">
                              <div className="flex flex-wrap gap-3">
                                {labData.parameters.map((item, paramIndex) => (
                                  <div
                                    key={paramIndex}
                                    className="group rounded-xl bg-white border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                                  >
                                    <div className="p-3">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-sm flex items-center justify-center">
                                          <HiBeaker className="w-3 h-3 text-white" />
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-700 leading-snug">
                                          {item.parameter}
                                        </h4>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CollapsibleDetails>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE VIEW - CLEAN & SMOOTH */}
        <div className="lg:hidden space-y-4">
          {Object.entries(groupedData).map(([labName, labData]) => (
            <div
              key={labName}
              className="rounded-xl shadow-lg border border-gray-200 bg-white overflow-hidden"
            >
              {/* Lab Header */}
              <div
                className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 cursor-pointer flex justify-between items-center"
                onClick={() => toggleExpansion(labName)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <FaFlaskVial className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-base font-medium text-white">
                    {labName}
                  </h4>
                </div>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300
                  ${
                    expandedLabs[labName]
                      ? "bg-white text-blue-600 rotate-180"
                      : "bg-white/20 backdrop-blur-sm text-white"
                  }`}
                >
                  <IoChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-px bg-gray-200">
                <div className="bg-white p-4 text-center">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Total
                  </p>
                  <p className="text-xl font-semibold text-blue-600">
                    {labData.total}
                  </p>
                </div>

                <div className="bg-white p-4 text-center">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Value
                  </p>
                  <p className="text-lg font-semibold text-pink-600">
                    ₹{formatAmount(labData.labRegValue)}
                  </p>
                </div>

                <div className="bg-white p-4 text-center">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Delivered
                  </p>
                  <p className="text-xl font-semibold text-emerald-600">
                    {labData.released}
                  </p>
                </div>

                <div className="bg-white p-4 text-center">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Pending
                  </p>
                  <p className="text-xl font-semibold text-rose-600">
                    {labData.pending}
                  </p>
                </div>
              </div>

              {/* Status & Time */}
              <div className="grid grid-cols-2 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Latest Completion
                  </p>
                  <p className="text-xs text-gray-700">
                    {labData.latestCompletionTime || "N/A"}
                  </p>
                </div>
                <div className="bg-white p-4 flex flex-col justify-center items-center">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Status
                  </p>
                  {getLabStatusBadge(labData.overallStatus)}
                </div>
              </div>

              {/* Parameters */}
              <CollapsibleDetails isExpanded={expandedLabs[labName]}>
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <FaMicroscope className="w-4 h-4 text-blue-600" />
                    <h5 className="text-sm font-medium text-gray-700">
                      Parameters
                    </h5>
                  </div>

                  <div className="space-y-3">
                    {labData.parameters.map((item, paramIndex) => (
                      <div
                        key={paramIndex}
                        className="rounded-lg bg-white border border-gray-200 shadow-sm p-4 hover:border-blue-300 transition-colors duration-300"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-1">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                              <FaMicroscope className="w-3 h-3 text-white" />
                            </div>
                            <h6 className="text-sm font-medium text-gray-700">
                              {item.parameter}
                            </h6>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1.5">
                            <HiCurrencyRupee className="w-4 h-4 text-pink-600" />
                            <span className="text-xs font-medium text-gray-700">
                              ₹{formatAmount(item.distributedRegisVal)}
                            </span>
                          </div>
                          {getParameterStatusBadge(item)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleDetails>
            </div>
          ))}
        </div>

        {data.length === 0 && initialSearchDone && !loading && (
          <div className="text-center py-10 text-gray-500 font-medium">
            No analysis data found for this registration number.
          </div>
        )}
        {data.length === 0 && !initialSearchDone && !loading && (
          <div className="text-center py-10 text-gray-500 font-medium">
            Enter a Registration Number to view details.
          </div>
        )}
      </div>
    );
  }
);

const InitialStateView = ({ showInitialLoader }) => (
  <div className="flex flex-col justify-center items-center py-20 bg-white rounded-xl shadow-lg border border-gray-200">
    {showInitialLoader ? (
      <div className="flex flex-col items-center">
        <div className="relative mb-6 w-20 h-20">
          <FlaskConical className="w-16 h-16 text-blue-500 absolute animate-ping opacity-75" />
          <TestTube2 className="w-16 h-16 text-indigo-600 absolute top-0 left-0" />
        </div>
        <span className="text-xl font-medium text-indigo-700 mt-2">
          Initializing Sample Portal...
        </span>
        <span className="text-sm text-gray-500">
          Preparing for your first search.
        </span>
      </div>
    ) : (
      <div className="flex flex-col items-center">
        <div className="relative mb-6 w-20 h-20">
          <Search className="w-16 h-16 text-gray-400 absolute top-0 left-0" />
          <ClipboardList className="w-8 h-8 text-blue-500 absolute bottom-0 right-0 p-1 bg-white rounded-full border-2 border-white" />
        </div>
        <span className="text-xl font-medium text-gray-600">
          Enter a Registration Number to begin analysis.
        </span>
        <span className="text-sm text-gray-400 mt-1">
          Please use the search bar above to fetch sample details.
        </span>
      </div>
    )}
  </div>
);

export default function SampleAnalysis() {
  const [regNo, setRegNo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialSearchDone, setInitialSearchDone] = useState(false);
  const [showInitialLoader, setShowInitialLoader] = useState(true);

  const sampleDetails = data && data.length > 0 ? data[0] : null;

  const summaryData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalParameters: 0,
        pending: 0,
        released: 0,
        pendingRegValue: 0,
        totalLabs: 0,
        uniqueLabNames: [],
      };
    }

    const calculatedData = data.map((item) => ({
      ...item,
      calculatedStatus: getCalculatedStatus(item),
    }));

    const released = calculatedData.filter(
      (item) => item.calculatedStatus === "Report Delivered"
    );
    const pendingItems = calculatedData.filter(
      (item) => item.calculatedStatus !== "Report Delivered"
    );

    const pendingRegValue = pendingItems.reduce(
      (sum, item) => sum + (parseFloat(item.distributedRegisVal) || 0),
      0
    );

    // Group by lab and check for pending status
    const labGroupData = data.reduce((acc, item) => {
      const labName = item.lab || "N/A";
      if (!acc[labName]) {
        acc[labName] = {
          hasPending: false,
        };
      }

      const calculatedStatus = getCalculatedStatus(item);

      if (
        calculatedStatus === "Pending from Lab End" ||
        calculatedStatus === "Pending from QA End"
      ) {
        acc[labName].hasPending = true;
      }

      return acc;
    }, {});

    // Create the structured array for chips
    const uniqueLabNamesWithStatus = Object.entries(labGroupData)
      .map(([name, status]) => {
        // Chip is red if any parameter is pending, otherwise green
        const statusColor = status.hasPending ? "red" : "green";

        return {
          name: name,
          statusColor: statusColor,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      totalParameters: data.length,
      pending: pendingItems.length,
      released: released.length,
      pendingRegValue: pendingRegValue,
      totalLabs: uniqueLabNamesWithStatus.length,
      uniqueLabNames: uniqueLabNamesWithStatus,
    };
  }, [data]);

  const handleSearch = useCallback(async () => {
    const trimmedRegNo = regNo?.trim();

    setInitialSearchDone(true);
    setShowInitialLoader(false);

    if (!trimmedRegNo) {
      setError("Please enter a Registration Number.");
      setData(null);
      return;
    }

    if (trimmedRegNo.length < 16) {
      setError("Registration Number must be at least 16 characters long.");
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await getSampleDetailsByRegNo(trimmedRegNo);

      if (!result || result.length === 0) {
        setError(`No analysis data found for Registration No: ${trimmedRegNo}`);
        setData([]);
      } else {
        setData(result);
      }
    } catch (e) {
      console.error("API Error:", e);
      setError("An error occurred while fetching data. Please try again.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [regNo]);

  React.useEffect(() => {
    if (regNo && !initialSearchDone) {
      handleSearch();
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!initialSearchDone) {
        setShowInitialLoader(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [initialSearchDone]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section - CLEAN & SIMPLE */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl mb-8 bg-white border border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-95"></div>

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Title Section */}
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm shadow-lg">
                  <FlaskConical className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Sample Analysis
                  </h1>
                  <p className="text-blue-100 text-sm mt-1">
                    Sample details of a Registration No
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="w-full lg:w-auto lg:min-w-[400px]">
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white shadow-lg">
                  <input
                    type="text"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Enter Registration Number"
                    className="flex-1 px-4 py-2 bg-transparent text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all duration-300 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        <span className="hidden sm:inline">Searching</span>
                      </>
                    ) : (
                      <>
                        <IoSearch className="w-4 h-4" />
                        <span className="hidden sm:inline">Search</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Details Card */}
        {sampleDetails && !loading && <SampleDetailsCard data={data} />}

        {/* Main Content */}
        <div className="mt-8">
          {loading && (
            <div className="flex flex-col justify-center items-center py-20 bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
                <FlaskConical className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <span className="text-xl font-medium text-gray-700">
                Analyzing Sample Data
              </span>
              <span className="text-sm text-gray-500 mt-2">
                Please wait while we fetch the results
              </span>
            </div>
          )}

          {error && initialSearchDone && !loading && (
            <div className="p-8 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center gap-4 shadow-md">
              <IoWarning className="w-6 h-6 text-red-600" />
              <p className="text-base font-medium text-red-800">{error}</p>
            </div>
          )}

          {data && data.length > 0 && !loading && (
            <>
              {/* Summary Cards Grid - MODIFIED: lg:grid-cols-4, removed two cards, fixed Associate Labs span */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <SummaryCard
                  title="Total Parameters"
                  value={summaryData.totalParameters}
                  color="blue"
                  icon={<FaFlaskVial className="w-5 h-5" />}
                />

                {/* ASSOCIATE LABS CARD - WIDER (lg:col-span-2) and value is null */}
                <SummaryCard
                  title="Associate Labs"
                  value={null}
                  color="teal"
                  icon={<FaMicroscope className="w-5 h-5" />}
                  chips={summaryData.uniqueLabNames}
                  className="lg:col-span-2"
                />

                {/* <SummaryCard
                  title="Pending Value"
                  value={`₹${formatAmount(summaryData.pendingRegValue)}`}
                  color="red"
                  icon={<HiCurrencyRupee className="w-5 h-5" />}
                /> */}
              </div>

              <SampleAnalysisTable
                data={data}
                loading={loading}
                initialSearchDone={initialSearchDone}
              />
            </>
          )}

          {!loading && !initialSearchDone && !data && !error && (
            <InitialStateView showInitialLoader={showInitialLoader} />
          )}
        </div>
      </div>
    </div>
  );
}
