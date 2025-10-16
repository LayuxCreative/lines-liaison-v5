import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, DollarSign, Users, Tag, AlertCircle, FileText, Hash, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from '../../hooks/useAuth';
import UserStatusIndicator from '../../components/common/UserStatusIndicator';
import { Project, User, Contract } from "../../types";
import { supabaseService } from '../../services/supabaseService';

interface ProjectFormData {
  name: string;
  description: string;
  clientId: string;
  managerId: string;
  teamMembers: string[];
  contractId: string;
  startDate: string;
  endDate: string;
  budget: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planning' | 'active' | 'review' | 'completed' | 'on_hold';
  category: 'BIM' | 'ICE' | 'Structural' | 'MEP' | 'Civil' | 'Industrial' | 'Training';
  projectCode: string;
  tags: string[];
}

const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addProject } = useData();
  const { addNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<User[]>([]);
  const [projectManagers, setProjectManagers] = useState<User[]>([]);
  const [teamMembersList, setTeamMembersList] = useState<User[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showContractWarning, setShowContractWarning] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    clientId: '',
    managerId: '',
    teamMembers: [],
    contractId: '',
    startDate: '',
    endDate: '',
    budget: '',
    priority: 'medium',
    status: 'planning',
    category: 'BIM',
    projectCode: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData, managersData, teamData, contractsData] = await Promise.all([
          supabaseService.getUsers().then(users => users.filter(u => u.role === 'client')),
          supabaseService.getUsers().then(users => users.filter(u => u.role === 'project_manager')),
          supabaseService.getUsers().then(users => users.filter(u => u.role === 'team_member')),
          [] // Empty array for contracts until proper method is available
        ]);
        setClients(clientsData);
        setProjectManagers(managersData);
        
        setTeamMembersList(teamData);
        
        setContracts(contractsData);
      } catch (error) {
        console.error('Error loading data:', error);
        setTeamMembersList([]);
      }
    };
    loadData();
  }, []);

  // Generate unique project code
  const generateProjectCode = () => {
    const prefix = formData.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  };

  // Handle contract selection and auto-fill budget
  const handleContractChange = (contractId: string) => {
    const selectedContract = contracts.find(c => c.id === contractId);
    setFormData(prev => ({
      ...prev,
      contractId,
      budget: selectedContract ? selectedContract.value.toString() : prev.budget
    }));
    setShowContractWarning(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if contract is selected, show warning if not
    if (!formData.contractId) {
      setShowContractWarning(true);
    }
    
    // Generate project code if not provided
    const generatedProjectCode = formData.projectCode || generateProjectCode();
    
    setIsLoading(true);

    try {
      const projectData: Omit<Project, "id" | "createdAt"> = {
        name: formData.name,
        description: formData.description,
        projectCode: generatedProjectCode,
        clientId: formData.clientId,
        managerId: formData.managerId,
        teamMembers: formData.teamMembers,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        budget: parseFloat(formData.budget) || 0,
        spent: 0,
        contractId: formData.contractId || undefined,
        priority: formData.priority,
        status: formData.status,
        category: formData.category,
        progress: 0,
        files: []
      };

      await addProject(projectData as Project);
      
      // Create notification for project creation
      addNotification({
        title: 'Project Created',
        message: `Project "${formData.name}" has been created successfully`,
        type: 'success',
        userId: user?.id || 'system'
      });
      
      // Create notifications for team members
      formData.teamMembers.forEach(memberId => {
        addNotification({
          title: 'Added to Project',
          message: `You have been added to project "${formData.name}"`,
          type: 'info',
          userId: memberId
        });
      });

      navigate('/dashboard/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to create project. Please try again.',
        type: 'error',
        userId: user?.id || 'system'
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard/projects')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
              <p className="text-gray-600 mt-2">Set up a new engineering project</p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    autoComplete="off"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter project name"
                  />
                </div>
                
                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />
                    Client
                  </label>
                  <select
                    id="clientId"
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Describe the project scope and objectives"
                />
              </div>
            </div>

            {/* Project Team */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Project Team</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="managerId" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Manager *
                  </label>
                  <select
                    id="managerId"
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  >
                    <option value="">Select a project manager</option>
                    {projectManagers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Members
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2">
                    {teamMembersList.map(member => {
                      const isSelected = formData.teamMembers.includes(member.id);
                      const displayName = member.full_name || member.name || 'Unknown User';
                      const avatarUrl = member.avatar_url || member.avatar;
                      const position = member.position || 'Team Member';
                      const status = member.status || 'available';
                      
                      return (
                        <div
                          key={member.id}
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              teamMembers: isSelected
                                ? prev.teamMembers.filter(id => id !== member.id)
                                : [...prev.teamMembers, member.id]
                            }));
                          }}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="relative">
                            <img
                               src={avatarUrl}
                               alt={displayName}
                               className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent hover:ring-blue-200 transition-all duration-300"
                             />
                             <UserStatusIndicator status={status} size="sm" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {displayName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {position}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.teamMembers.length} member{formData.teamMembers.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>
            </div>

            {/* Contract & Budget */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Contract & Budget</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contractId" className="block text-sm font-medium text-gray-700 mb-2">
                    Contract
                  </label>
                  <select
                    id="contractId"
                    name="contractId"
                    value={formData.contractId}
                    onChange={(e) => handleContractChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Select a contract (optional)</option>
                    {contracts.map(contract => (
                      <option key={contract.id} value={contract.id}>
                        {contract.title} - ${contract.value.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {showContractWarning && (
                    <div className="flex items-center mt-2 text-amber-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm">No contract selected - project will proceed without contract link</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (USD)
                  </label>
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Timeline</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Project Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Tag className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Project Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  >
                    <option value="BIM">BIM</option>
                    <option value="ICE">ICE</option>
                    <option value="Structural">Structural</option>
                    <option value="MEP">MEP</option>
                    <option value="Civil">Civil</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Training">Training</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="review">Review</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="projectCode" className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-2" />
                  Project Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="projectCode"
                    name="projectCode"
                    value={formData.projectCode}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Leave empty to auto-generate"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, projectCode: generateProjectCode() }))}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Format: {formData.category.substring(0, 3).toUpperCase()}-XXXXXX</p>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Tag className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Tags</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Tags
                </label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Add a tag"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard/projects')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name || !formData.description}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateProject;