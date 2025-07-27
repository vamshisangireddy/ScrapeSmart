// Chrome extension types for development environment
declare global {
  interface Window {
    chrome?: typeof chrome;
  }
}

// Chrome API type augmentation
declare namespace chrome {
  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
    }
    
    function query(queryInfo: { active: boolean; currentWindow: boolean }): Promise<Tab[]>;
    function sendMessage(tabId: number, message: any, callback?: (response: any) => void): void;
  }
  
  namespace runtime {
    const lastError: { message: string } | undefined;
    const id: string | undefined;
    
    function sendMessage(message: any, callback?: (response: any) => void): void;
  }
}

export {};