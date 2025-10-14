import { realtimeService, RealtimeMessage } from './RealtimeService';

export interface ProjectChannel {
  projectId: string;
  projectName: string;
  isActive: boolean;
  participantCount: number;
  lastActivity: Date;
}

export interface TaskChannel {
  taskId: string;
  taskTitle: string;
  projectId: string;
  assignees: string[];
  isActive: boolean;
  lastActivity: Date;
}

export class ProjectChannelsManager {
  private activeProjectChannels: Map<string, ProjectChannel> = new Map();
  private activeTaskChannels: Map<string, TaskChannel> = new Map();

  constructor() {
    this.setupEventHandlers();
  }

  // Project Channels
  async joinProjectChannel(projectId: string, projectName: string): Promise<void> {
    try {
      await realtimeService.joinChannel('project', projectId);
      
      const projectChannel: ProjectChannel = {
        projectId,
        projectName,
        isActive: true,
        participantCount: 1,
        lastActivity: new Date()
      };

      this.activeProjectChannels.set(projectId, projectChannel);
      
      // Send join notification
      await realtimeService.sendMessage(
        'project',
        projectId,
        `Joined project ${projectName}`,
        'notification',
        { action: 'user_joined', projectId, projectName }
      );

      console.log(`✅ Joined project channel: ${projectName} (${projectId})`);
    } catch (error) {
      console.error(`❌ Failed to join project channel ${projectId}:`, error);
      throw error;
    }
  }

  async leaveProjectChannel(projectId: string): Promise<void> {
    try {
      const projectChannel = this.activeProjectChannels.get(projectId);
      
      if (projectChannel) {
        // Send leave notification
        await realtimeService.sendMessage(
          'project',
          projectId,
          `Left project ${projectChannel.projectName}`,
          'notification',
          { action: 'user_left', projectId, projectName: projectChannel.projectName }
        );
      }

      await realtimeService.leaveChannel('project', projectId);
      this.activeProjectChannels.delete(projectId);
      
      console.log(`✅ Left project channel: ${projectId}`);
    } catch (error) {
      console.error(`❌ Failed to leave project channel ${projectId}:`, error);
    }
  }

  async sendProjectMessage(projectId: string, message: string): Promise<void> {
    try {
      await realtimeService.sendMessage('project', projectId, message, 'message');
      
      // Update last activity
      const projectChannel = this.activeProjectChannels.get(projectId);
      if (projectChannel) {
        projectChannel.lastActivity = new Date();
      }
    } catch (error) {
      console.error(`❌ Failed to send project message:`, error);
      throw error;
    }
  }

  async sendProjectUpdate(projectId: string, updateType: string, updateData: Record<string, unknown>): Promise<void> {
    try {
      await realtimeService.sendMessage(
        'project',
        projectId,
        `Project update: ${updateType}`,
        'project_update',
        { updateType, ...updateData }
      );
    } catch (error) {
      console.error(`❌ Failed to send project update:`, error);
      throw error;
    }
  }

  // Task Channels
  async joinTaskChannel(taskId: string, taskTitle: string, projectId: string, assignees: string[] = []): Promise<void> {
    try {
      await realtimeService.joinChannel('task', taskId);
      
      const taskChannel: TaskChannel = {
        taskId,
        taskTitle,
        projectId,
        assignees,
        isActive: true,
        lastActivity: new Date()
      };

      this.activeTaskChannels.set(taskId, taskChannel);
      
      // Send join notification
      await realtimeService.sendMessage(
        'task',
        taskId,
        `Joined task: ${taskTitle}`,
        'notification',
        { action: 'user_joined', taskId, taskTitle, projectId }
      );

      console.log(`✅ Joined task channel: ${taskTitle} (${taskId})`);
    } catch (error) {
      console.error(`❌ Failed to join task channel ${taskId}:`, error);
      throw error;
    }
  }

  async leaveTaskChannel(taskId: string): Promise<void> {
    try {
      const taskChannel = this.activeTaskChannels.get(taskId);
      
      if (taskChannel) {
        // Send leave notification
        await realtimeService.sendMessage(
          'task',
          taskId,
          `Left task: ${taskChannel.taskTitle}`,
          'notification',
          { action: 'user_left', taskId, taskTitle: taskChannel.taskTitle }
        );
      }

      await realtimeService.leaveChannel('task', taskId);
      this.activeTaskChannels.delete(taskId);
      
      console.log(`✅ Left task channel: ${taskId}`);
    } catch (error) {
      console.error(`❌ Failed to leave task channel ${taskId}:`, error);
    }
  }

  async sendTaskMessage(taskId: string, message: string): Promise<void> {
    try {
      await realtimeService.sendMessage('task', taskId, message, 'message');
      
      // Update last activity
      const taskChannel = this.activeTaskChannels.get(taskId);
      if (taskChannel) {
        taskChannel.lastActivity = new Date();
      }
    } catch (error) {
      console.error(`❌ Failed to send task message:`, error);
      throw error;
    }
  }

  async sendTaskUpdate(taskId: string, updateType: string, updateData: Record<string, unknown>): Promise<void> {
    try {
      await realtimeService.sendMessage(
        'task',
        taskId,
        `Task update: ${updateType}`,
        'task_update',
        { updateType, ...updateData }
      );
    } catch (error) {
      console.error(`❌ Failed to send task update:`, error);
      throw error;
    }
  }

  // Team Communication
  async joinTeamChannel(teamId: string, teamName: string): Promise<void> {
    try {
      await realtimeService.joinChannel('team', teamId);
      
      await realtimeService.sendMessage(
        'team',
        teamId,
        `Joined team ${teamName}`,
        'notification',
        { action: 'user_joined', teamId, teamName }
      );

      console.log(`✅ Joined team channel: ${teamName} (${teamId})`);
    } catch (error) {
      console.error(`❌ Failed to join team channel ${teamId}:`, error);
      throw error;
    }
  }

  async sendTeamMessage(teamId: string, message: string): Promise<void> {
    try {
      await realtimeService.sendMessage('team', teamId, message, 'message');
    } catch (error) {
      console.error(`❌ Failed to send team message:`, error);
      throw error;
    }
  }

  // General Communication
  async joinGeneralChannel(): Promise<void> {
    try {
      await realtimeService.joinChannel('general', 'main');
      
      await realtimeService.sendMessage(
        'general',
        'main',
        'Joined general channel',
        'notification',
        { action: 'user_joined' }
      );

      console.log(`✅ Joined general channel`);
    } catch (error) {
      console.error(`❌ Failed to join general channel:`, error);
      throw error;
    }
  }

  async sendGeneralMessage(message: string): Promise<void> {
    try {
      await realtimeService.sendMessage('general', 'main', message, 'message');
    } catch (error) {
      console.error(`❌ Failed to send general message:`, error);
      throw error;
    }
  }

  // Typing indicators
  async sendTypingIndicator(channelType: string, channelId: string, isTyping: boolean): Promise<void> {
    try {
      await realtimeService.sendTyping(channelType, channelId, isTyping);
    } catch (error) {
      console.error(`❌ Failed to send typing indicator:`, error);
    }
  }

  // Get active channels
  getActiveProjectChannels(): ProjectChannel[] {
    return Array.from(this.activeProjectChannels.values());
  }

  getActiveTaskChannels(): TaskChannel[] {
    return Array.from(this.activeTaskChannels.values());
  }

  getChannelParticipants(channelType: string, channelId: string) {
    return realtimeService.getChannelParticipants(channelType, channelId);
  }

  // Event handlers
  private setupEventHandlers(): void {
    realtimeService.on('message', (data: unknown) => {
      this.handleIncomingMessage(data as RealtimeMessage);
    });

    realtimeService.on('typing', (data: unknown) => {
      this.handleTypingIndicator(data);
    });

    realtimeService.on('user_status', (data: unknown) => {
      this.handleUserStatusChange(data);
    });

    realtimeService.on('presence_join', (data: unknown) => {
      this.handleUserJoin(data);
    });

    realtimeService.on('presence_leave', (data: unknown) => {
      this.handleUserLeave(data);
    });
  }

  private handleIncomingMessage(message: RealtimeMessage): void {
    console.log(`📨 New message in ${message.roomId}:`, message.content);
    
    // Update channel activity
    if (message.roomId) {
      const projectChannel = this.activeProjectChannels.get(message.roomId);
      if (projectChannel) {
        projectChannel.lastActivity = new Date();
      }

      const taskChannel = this.activeTaskChannels.get(message.roomId);
      if (taskChannel) {
        taskChannel.lastActivity = new Date();
      }
    }
  }

  private handleTypingIndicator(data: unknown): void {
    console.log('⌨️ Typing indicator:', data);
  }

  private handleUserStatusChange(data: unknown): void {
    console.log('👤 User status changed:', data);
  }

  private handleUserJoin(data: unknown): void {
    console.log('👋 User joined:', data);
  }

  private handleUserLeave(data: unknown): void {
    console.log('👋 User left:', data);
  }

  // Cleanup
  async disconnectAll(): Promise<void> {
    // Leave all project channels
    for (const projectId of this.activeProjectChannels.keys()) {
      await this.leaveProjectChannel(projectId);
    }

    // Leave all task channels
    for (const taskId of this.activeTaskChannels.keys()) {
      await this.leaveTaskChannel(taskId);
    }

    // Clear maps
    this.activeProjectChannels.clear();
    this.activeTaskChannels.clear();

    console.log('✅ Disconnected from all channels');
  }
}

// Export singleton instance
export const projectChannelsManager = new ProjectChannelsManager();