import React, { useState } from "react";
import { PermissionRestriction, Permission } from "../../types";

interface PermissionRestrictionsProps {
  permissions: Permission[];
  restrictions: PermissionRestriction[];
  onRestrictionCreate?: (
    restriction: Omit<PermissionRestriction, "id">,
  ) => void;
  onRestrictionUpdate?: (
    restrictionId: string,
    updates: Partial<PermissionRestriction>,
  ) => void;
  onRestrictionDelete?: (restrictionId: string) => void;
}

type RestrictionType = "time_based" | "ip_based" | "project_based" | "custom";

interface NewRestriction {
  type: RestrictionType;
  conditions: Record<string, string | number | boolean>;
  isActive: boolean;
  expiresAt?: Date;
}

export const PermissionRestrictions: React.FC<PermissionRestrictionsProps> = ({
  permissions,
  restrictions,
  onRestrictionCreate,
  onRestrictionUpdate,
  onRestrictionDelete,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "create" | "manage">(
    "overview",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<RestrictionType | "all">("all");

  const [newRestriction, setNewRestriction] = useState<NewRestriction>({
    type: "time_based",
    conditions: {},
    isActive: true,
  });

  const [editingRestriction, setEditingRestriction] =
    useState<PermissionRestriction | null>(null);

  // Use restrictions from props - data should come from Supabase
  const [localRestrictions, setLocalRestrictions] = useState<
    PermissionRestriction[]
  >(restrictions || []);

  const filteredRestrictions = localRestrictions.filter((restriction) => {
    const description = restriction.conditions.description || "";
    const resource = restriction.conditions.resource || "";
    const matchesSearch =
      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || restriction.type === filterType;

    return matchesSearch && matchesType;
  });

  const getRestrictionIcon = (type: RestrictionType) => {
    switch (type) {
      case "time_based":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "ip_based":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "project_based":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "custom":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getTypeColor = (type: RestrictionType) => {
    switch (type) {
      case "time_based":
        return "bg-blue-100 text-blue-800";
      case "ip_based":
        return "bg-green-100 text-green-800";
      case "project_based":
        return "bg-purple-100 text-purple-800";
      case "custom":
        return "bg-orange-100 text-orange-800";
    }
  };

  const handleCreateRestriction = () => {
    if (
      !newRestriction.conditions ||
      Object.keys(newRestriction.conditions).length === 0
    ) {
      return;
    }

    const restriction: PermissionRestriction = {
      id: `rest_${Date.now()}`,
      type: newRestriction.type,
      conditions: newRestriction.conditions,
      isActive: newRestriction.isActive,
      expiresAt: newRestriction.expiresAt,
    };

    setLocalRestrictions((prev) => [...prev, restriction]);

    if (onRestrictionCreate) {
      onRestrictionCreate(restriction);
    }

    setNewRestriction({
      type: "time_based",
      conditions: {},
      isActive: true,
    });

    setActiveTab("manage");
  };

  const handleUpdateRestriction = (restriction: PermissionRestriction) => {
    setLocalRestrictions((prev) =>
      prev.map((r) => (r.id === restriction.id ? restriction : r)),
    );

    if (onRestrictionUpdate) {
      onRestrictionUpdate(restriction.id, restriction);
    }

    setEditingRestriction(null);
  };

  const handleDeleteRestriction = (restrictionId: string) => {
    if (confirm("Are you sure you want to delete this restriction?")) {
      setLocalRestrictions((prev) =>
        prev.filter((r) => r.id !== restrictionId),
      );

      if (onRestrictionDelete) {
        onRestrictionDelete(restrictionId);
      }
    }
  };

  const toggleRestrictionStatus = (restrictionId: string) => {
    setLocalRestrictions((prev) =>
      prev.map((r) =>
        r.id === restrictionId ? { ...r, isActive: !r.isActive } : r,
      ),
    );
  };

  const getConditionOptions = (type: RestrictionType) => {
    switch (type) {
      case "time_based":
        return [
          { value: "business_hours_only", label: "Business Hours Only" },
          { value: "weekdays_only", label: "Weekdays Only" },
          { value: "specific_hours", label: "Specific Hours" },
          { value: "time_range", label: "Time Range" },
        ];
      case "ip_based":
        return [
          { value: "ip_whitelist", label: "IP Whitelist" },
          { value: "country_restriction", label: "Country Restriction" },
          { value: "office_only", label: "Office Only" },
          { value: "vpn_required", label: "VPN Required" },
        ];
      case "project_based":
        return [
          { value: "device_type", label: "Device Type" },
          { value: "trusted_devices", label: "Trusted Devices Only" },
          { value: "mobile_restricted", label: "Mobile Restricted" },
          { value: "browser_restriction", label: "Browser Restriction" },
        ];
      case "custom":
        return [
          { value: "user_status", label: "User Status" },
          { value: "role_based", label: "Role Based" },
          { value: "project_member", label: "Project Member" },
          { value: "approval_required", label: "Approval Required" },
        ];
      default:
        return [];
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg
                className="w-6 h-6 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Restrictions
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {localRestrictions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {localRestrictions.filter((r) => r.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-semibold text-gray-900">
                {localRestrictions.filter((r) => !r.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Types</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(localRestrictions.map((r) => r.type)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Restriction Types Overview */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Restriction Types
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(
              [
                "time_based",
                "ip_based",
                "project_based",
                "custom",
              ] as RestrictionType[]
            ).map((type) => {
              const count = localRestrictions.filter(
                (r) => r.type === type,
              ).length;
              const activeCount = localRestrictions.filter(
                (r) => r.type === type && r.isActive,
              ).length;

              return (
                <div key={type} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-2 rounded-lg ${getTypeColor(type)}`}>
                      {getRestrictionIcon(type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {type.replace("_", " ")}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {count} total, {activeCount} active
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Restrictions */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Restrictions
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {localRestrictions.slice(0, 5).map((restriction) => (
              <div
                key={restriction.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${getTypeColor(restriction.type)}`}
                  >
                    {getRestrictionIcon(restriction.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {restriction.conditions.description || "No description"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {restriction.conditions.resource || "No resource"} •{" "}
                      {restriction.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      restriction.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {restriction.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreateTab = () => (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Create New Restriction
      </h3>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restriction Type
            </label>
            <select
              value={newRestriction.type}
              onChange={(e) =>
                setNewRestriction((prev) => ({
                  ...prev,
                  type: e.target.value as RestrictionType,
                  conditions: {}, // Reset conditions when type changes
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="time_based">Time-based</option>
              <option value="ip_based">IP-based</option>
              <option value="project_based">Project-based</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resource
            </label>
            <select
              value={newRestriction.conditions.resource || ""}
              onChange={(e) =>
                setNewRestriction((prev) => ({
                  ...prev,
                  conditions: { ...prev.conditions, resource: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select resource</option>
              {Array.from(new Set(permissions.map((p) => p.resource))).map(
                (resource) => (
                  <option key={resource} value={resource}>
                    {resource}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              value={newRestriction.conditions.conditionType || ""}
              onChange={(e) =>
                setNewRestriction((prev) => ({
                  ...prev,
                  conditions: {
                    ...prev.conditions,
                    conditionType: e.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select condition</option>
              {getConditionOptions(newRestriction.type).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value
            </label>
            <input
              type="text"
              value={newRestriction.conditions.value || ""}
              onChange={(e) =>
                setNewRestriction((prev) => ({
                  ...prev,
                  conditions: { ...prev.conditions, value: e.target.value },
                }))
              }
              placeholder="Enter restriction value"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={newRestriction.conditions.description || ""}
            onChange={(e) =>
              setNewRestriction((prev) => ({
                ...prev,
                conditions: { ...prev.conditions, description: e.target.value },
              }))
            }
            placeholder="Describe this restriction"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={newRestriction.isActive}
            onChange={(e) =>
              setNewRestriction((prev) => ({
                ...prev,
                isActive: e.target.checked,
              }))
            }
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
            Active restriction
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
        <button
          onClick={() =>
            setNewRestriction({
              type: "time_based",
              conditions: {},
              isActive: true,
            })
          }
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleCreateRestriction}
          disabled={
            !newRestriction.conditions.resource ||
            !newRestriction.conditions.conditionType
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Create Restriction
        </button>
      </div>
    </div>
  );

  const renderManageTab = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search restrictions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) =>
            setFilterType(e.target.value as RestrictionType | "all")
          }
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="time_based">Time-based</option>
          <option value="ip_based">IP-based</option>
          <option value="project_based">Project-based</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Restrictions List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Restrictions ({filteredRestrictions.length})
          </h3>
        </div>
        <div className="divide-y">
          {filteredRestrictions.map((restriction) => (
            <div key={restriction.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-lg ${getTypeColor(restriction.type)}`}
                  >
                    {getRestrictionIcon(restriction.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">
                        {restriction.conditions.description ||
                          "No description available"}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          restriction.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {restriction.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">Resource:</span>{" "}
                        {restriction.conditions.resource || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Type:</span>{" "}
                        {restriction.type}
                      </p>
                      <p>
                        <span className="font-medium">Value:</span>{" "}
                        {restriction.conditions.value || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleRestrictionStatus(restriction.id)}
                    className={`px-3 py-1 rounded text-sm ${
                      restriction.isActive
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                  >
                    {restriction.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => setEditingRestriction(restriction)}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRestriction(restriction.id)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredRestrictions.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No restrictions found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Permission Restrictions
          </h2>
          <p className="text-gray-600">
            Manage access restrictions and conditions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", name: "Overview", icon: "📊" },
            { id: "create", name: "Create", icon: "➕" },
            { id: "manage", name: "Manage", icon: "⚙️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "overview" | "create" | "manage")}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && renderOverviewTab()}
      {activeTab === "create" && renderCreateTab()}
      {activeTab === "manage" && renderManageTab()}

      {/* Edit Restriction Modal */}
      {editingRestriction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Edit Restriction
              </h3>
              <button
                onClick={() => setEditingRestriction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editingRestriction.conditions.description || ""}
                  onChange={(e) =>
                    setEditingRestriction((prev) =>
                      prev
                        ? {
                            ...prev,
                            conditions: {
                              ...prev.conditions,
                              description: e.target.value,
                            },
                          }
                        : null,
                    )
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value
                </label>
                <input
                  type="text"
                  value={editingRestriction.conditions.value || ""}
                  onChange={(e) =>
                    setEditingRestriction((prev) =>
                      prev
                        ? {
                            ...prev,
                            conditions: {
                              ...prev.conditions,
                              value: e.target.value,
                            },
                          }
                        : null,
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingRestriction.isActive}
                  onChange={(e) =>
                    setEditingRestriction((prev) =>
                      prev ? { ...prev, isActive: e.target.checked } : null,
                    )
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="editIsActive"
                  className="ml-2 text-sm text-gray-700"
                >
                  Active restriction
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setEditingRestriction(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateRestriction(editingRestriction)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Restriction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionRestrictions;
