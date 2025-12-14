// This service handles interaction with Google Sheets and Drive APIs

const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
];

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

export class GoogleService {
  private tokenClient: any;
  private gapiInited = false;
  private gisInited = false;
  private accessToken: string | null = null;

  constructor() {
    this.tokenClient = null;
  }

  // Load the scripts and initialize the client
  public loadGapi(apiKey: string, clientId: string, onInit: (success: boolean) => void) {
    const gapi = (window as any).gapi;
    const google = (window as any).google;

    if (!gapi || !google) {
      console.error("Google Scripts not loaded");
      onInit(false);
      return;
    }

    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: apiKey,
          discoveryDocs: DISCOVERY_DOCS,
        });
        this.gapiInited = true;
        this.checkInit(onInit);
      } catch (err) {
        console.error("GAPI Init Error", err);
        onInit(false);
      }
    });

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp: any) => {
        if (resp.error !== undefined) {
          throw (resp);
        }
        this.accessToken = resp.access_token;
        console.log("Access Token Recieved");
      },
    });
    this.gisInited = true;
    this.checkInit(onInit);
  }

  private checkInit(callback: (success: boolean) => void) {
    if (this.gapiInited && this.gisInited) {
      callback(true);
    }
  }

  public handleAuthClick() {
    if (this.tokenClient && (window as any).gapi) {
      if ((window as any).gapi.client.getToken() === null) {
         this.tokenClient.requestAccessToken({prompt: 'consent'});
      } else {
         this.tokenClient.requestAccessToken({prompt: ''});
      }
    }
  }

  public handleSignOut() {
    const gapi = (window as any).gapi;
    const google = (window as any).google;
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken('');
      this.accessToken = null;
    }
  }

  public isAuthenticated(): boolean {
    const gapi = (window as any).gapi;
    return !!(gapi && gapi.client && gapi.client.getToken());
  }

  // --- DRIVE UPLOAD ---
  public async uploadFile(file: File): Promise<{ id: string, webContentLink: string, webViewLink: string }> {
     if (!this.accessToken) {
        // Try to get token if gapi has it
        const gapiToken = (window as any).gapi.client.getToken();
        if (gapiToken) this.accessToken = gapiToken.access_token;
        else throw new Error("Not Authenticated");
     }

     const metadata = {
       'name': file.name,
       'mimeType': file.type,
       // Optional: 'parents': ['FOLDER_ID'] 
     };

     const form = new FormData();
     form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
     form.append('file', file);

     const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webContentLink,webViewLink', {
       method: 'POST',
       headers: new Headers({ 'Authorization': 'Bearer ' + this.accessToken }),
       body: form
     });

     if (!response.ok) {
       throw new Error(`Drive Upload Failed: ${response.statusText}`);
     }

     return await response.json();
  }

  // --- SHEETS SYNC ---
  // Simple overwrite sync for tasks
  public async syncTasks(spreadsheetId: string, tasks: any[]) {
     const gapi = (window as any).gapi;
     if (!this.isAuthenticated()) throw new Error("Not Authenticated");

     // Format data for sheet
     // Header
     const header = ['ID', 'Title', 'Description', 'Priority', 'Status', 'Due Date', 'Assignee ID', 'Attachments Count'];
     const rows = tasks.map(t => [
       t.id,
       t.title,
       t.description,
       t.priority,
       t.status,
       t.dueDate,
       t.assigneeId || '',
       t.attachments?.length || 0
     ]);

     const values = [header, ...rows];
     const body = {
       values: values
     };

     // Clear sheet first (optional, but cleaner for full sync)
     await gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: 'Sheet1!A1:Z1000'
     });

     // Write new data
     await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: body
     });
     
     return true;
  }
}

export const googleService = new GoogleService();
