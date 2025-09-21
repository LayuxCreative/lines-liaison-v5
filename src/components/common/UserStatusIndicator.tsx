import React from "react";
import {
  Check,
  Circle,
  Minus,
  Clock,
  Moon,
  XCircle,
  Coffee,
  Plane,
} from "lucide-react";
import { UserStatusType } from "../../types";

interface UserStatusIndicatorProps {
  status?: UserStatusType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const UserStatusIndicator: React.FC<UserStatusIndicatorProps> = ({
  status = "available",
  size = "md",
  className = "",
}) => {
  const iconSizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const getStatusConfig = (status: UserStatusType) => {
    switch (status) {
      case "available":
        return { color: "bg-green-500", icon: Check };
      case "busy":
        return { color: "bg-red-500", icon: Circle };
      case "away":
        return { color: "bg-yellow-500", icon: Clock };
      case "in_meeting":
        return { color: "bg-red-600", icon: Minus };
      case "on_break":
        return { color: "bg-orange-500", icon: Coffee };
      case "out_of_office":
        return { color: "bg-gray-500", icon: XCircle };
      case "vacation":
        return { color: "bg-blue-500", icon: Plane };
      case "sick_leave":
        return { color: "bg-purple-500", icon: Moon };
      case "custom":
        return { color: "bg-indigo-500", icon: Circle };
      default:
        return { color: "bg-green-500", icon: Check };
    }
  };

  const getSizeClasses = (size: "sm" | "md" | "lg") => {
    switch (size) {
      case "sm":
        return "w-3 h-3";
      case "md":
        return "w-5 h-5";
      case "lg":
        return "w-6 h-6";
      default:
        return "w-5 h-5";
    }
  };

  const { color, icon: IconComponent } = getStatusConfig(status);

  const positionClasses = className.includes("relative")
    ? ""
    : "absolute -bottom-0.5 -right-0.5";

  return (
    <div
      className={`${getSizeClasses(size)} rounded-full ${color} ${className} flex items-center justify-center shadow-sm ${positionClasses}`}
      title={status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
    >
      <IconComponent
        className={`${iconSizeClasses[size]} text-white drop-shadow-sm`}
        strokeWidth={2.5}
      />
    </div>
  );
};

export default UserStatusIndicator;
