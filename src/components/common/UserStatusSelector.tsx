import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Check,
  Circle,
  Minus,
  Clock,
  Moon,
  XCircle,
  Coffee,
  Plane,
  LucideIcon,
} from "lucide-react";
import { UserStatusType } from "../../types";
import UserStatusIndicator from "./UserStatusIndicator";

interface UserStatusSelectorProps {
  currentStatus?: UserStatusType;
  onStatusChange: (status: UserStatusType) => void;
  className?: string;
  onDropdownToggle?: (isOpen: boolean) => void;
}

const UserStatusSelector: React.FC<UserStatusSelectorProps> = ({
  currentStatus = "available",
  onStatusChange,
  className = "",
  onDropdownToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onDropdownToggle) {
      onDropdownToggle(isOpen);
    }
  }, [isOpen, onDropdownToggle]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const statusOptions: {
    value: UserStatusType;
    label: string;
    description: string;
    icon: LucideIcon;
  }[] = [
    {
      value: "available",
      label: "Available",
      description: "Ready to work",
      icon: Check,
    },
    {
      value: "busy",
      label: "Busy",
      description: "Do not disturb",
      icon: Circle,
    },
    {
      value: "away",
      label: "Away",
      description: "Temporarily away",
      icon: Clock,
    },
    {
      value: "in_meeting",
      label: "In Meeting",
      description: "Currently in a meeting",
      icon: Minus,
    },
    {
      value: "on_break",
      label: "On Break",
      description: "Taking a break",
      icon: Coffee,
    },
    {
      value: "out_of_office",
      label: "Out of Office",
      description: "Not in the office",
      icon: XCircle,
    },
    {
      value: "vacation",
      label: "On Vacation",
      description: "On vacation",
      icon: Plane,
    },
    {
      value: "sick_leave",
      label: "Sick Leave",
      description: "On sick leave",
      icon: Moon,
    },
  ];

  const getCurrentStatusLabel = () => {
    const status = statusOptions.find(
      (option) => option.value === currentStatus,
    );
    return status?.label || "Available";
  };

  const handleStatusSelect = (status: UserStatusType) => {
    onStatusChange(status);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full"
      >
        <UserStatusIndicator
          status={currentStatus}
          size="sm"
          className="relative w-4 h-4 mr-3 text-gray-400"
        />
        <span className="flex-1 text-left">{getCurrentStatusLabel()}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-30 overflow-hidden">
          <div className="py-1">
            {statusOptions.map((option) => {
              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusSelect(option.value)}
                  className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full"
                >
                  <div className="w-4 h-4 mr-3 text-gray-400 flex items-center justify-center">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shadow-sm ${
                        option.value === "available"
                          ? "bg-green-500"
                          : option.value === "busy"
                            ? "bg-red-500"
                            : option.value === "away"
                              ? "bg-yellow-500"
                              : option.value === "in_meeting"
                                ? "bg-red-600"
                                : option.value === "on_break"
                                  ? "bg-orange-500"
                                  : option.value === "out_of_office"
                                    ? "bg-gray-500"
                                    : option.value === "vacation"
                                      ? "bg-blue-500"
                                      : option.value === "sick_leave"
                                        ? "bg-purple-500"
                                        : "bg-gray-400"
                      }`}
                    >
                      <option.icon
                        className="w-2.5 h-2.5 text-white drop-shadow-sm"
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                  {currentStatus === option.value && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStatusSelector;
