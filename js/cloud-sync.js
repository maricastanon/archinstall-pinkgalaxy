// ══ CLOUD SYNC MANAGER ══
import { Amplify, Auth, API, graphqlOperation } from 'aws-amplify';

// GraphQL queries and mutations
const getUserProgress = /* GraphQL */ `
  query GetUserProgress($username: String!) {
    getUserProgress(username: $username) {
      id
      username
      completedSteps
      currentChapter
      progress
      notebookEntries {
        id
        title
        content
        timestamp
        chapter
      }
      lastSyncDate
    }
  }
`;

const saveUserProgress = /* GraphQL */ `
  mutation SaveUserProgress($input: SaveProgressInput!) {
    saveUserProgress(input: $input) {
      id
      username
      completedSteps
      currentChapter
      progress
      notebookEntries {
        id
        title
        content
        timestamp
        chapter
      }
      lastSyncDate
    }
  }
`;

class CloudSync {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.username = null;
    
    // Listen for online/offline changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async init() {
    try {
      // Get current authenticated user
      const user = await Auth.currentAuthenticatedUser();
      this.username = user.username;
      
      // Initial sync from cloud
      await this.loadFromCloud();
      
      // Set up periodic sync (every 30 seconds)
      setInterval(() => this.syncData(), 30000);
      
      // Sync on page visibility change
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.isOnline) {
          this.syncData();
        }
      });
      
      return true;
    } catch (error) {
      console.log('User not authenticated, using local storage only');
      return false;
    }
  }

  async loadFromCloud() {
    if (!this.username || !this.isOnline) return;
    
    try {
      const result = await API.graphql(
        graphqlOperation(getUserProgress, { username: this.username })
      );
      
      const cloudData = result.data.getUserProgress;
      if (cloudData && cloudData.lastSyncDate) {
        // Merge cloud data with local data
        const localData = this.getLocalData();
        const merged = this.mergeData(localData, cloudData);
        
        // Update local storage
        this.saveLocalData(merged);
        
        // Trigger UI update
        if (window.App && window.App.loadProgress) {
          window.App.loadProgress();
        }
      }
    } catch (error) {
      console.error('Failed to load from cloud:', error);
    }
  }

  async syncData() {
    if (!this.username || !this.isOnline || this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      const localData = this.getLocalData();
      
      const input = {
        username: this.username,
        completedSteps: localData.completedSteps || [],
        currentChapter: localData.currentChapter || null,
        progress: localData.progress || 0,
        notebookEntries: localData.notebookEntries || []
      };

      await API.graphql(
        graphqlOperation(saveUserProgress, { input })
      );
      
      // Update sync indicator
      this.updateSyncIndicator('✅ Synced');
      
    } catch (error) {
      console.error('Failed to sync to cloud:', error);
      this.updateSyncIndicator('❌ Sync failed');
    } finally {
      this.syncInProgress = false;
    }
  }

  getLocalData() {
    try {
      return {
        completedSteps: JSON.parse(localStorage.getItem('pg_completed') || '[]'),
        currentChapter: localStorage.getItem('pg_current_chapter'),
        progress: parseFloat(localStorage.getItem('pg_progress') || '0'),
        notebookEntries: JSON.parse(localStorage.getItem('pg_notebook') || '[]')
      };
    } catch (error) {
      console.error('Failed to get local data:', error);
      return { completedSteps: [], progress: 0, notebookEntries: [] };
    }
  }

  saveLocalData(data) {
    try {
      localStorage.setItem('pg_completed', JSON.stringify(data.completedSteps));
      localStorage.setItem('pg_current_chapter', data.currentChapter || '');
      localStorage.setItem('pg_progress', data.progress.toString());
      localStorage.setItem('pg_notebook', JSON.stringify(data.notebookEntries));
    } catch (error) {
      console.error('Failed to save local data:', error);
    }
  }

  mergeData(localData, cloudData) {
    // Smart merge: use most recent data based on timestamps
    const localTime = new Date(localStorage.getItem('pg_last_update') || 0);
    const cloudTime = new Date(cloudData.lastSyncDate);
    
    if (cloudTime > localTime) {
      // Cloud data is newer
      return cloudData;
    } else {
      // Local data is newer
      return localData;
    }
  }

  updateSyncIndicator(message) {
    const indicator = document.getElementById('sync-status');
    if (indicator) {
      indicator.textContent = message;
      indicator.style.color = message.includes('✅') ? 'var(--green)' : 'var(--danger)';
    }
  }

  // Force sync method for manual triggers
  async forcSync() {
    if (!this.isOnline) {
      this.updateSyncIndicator('📶 Offline');
      return;
    }
    
    this.updateSyncIndicator('🔄 Syncing...');
    await this.syncData();
  }
}

// Global instance
window.CloudSync = new CloudSync();