import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    signOut: 'Sign Out',
    dashboard: 'Dashboard',
    conversations: 'Conversations',
    welcome: 'Welcome',
    
    // Landing page
    appTitle: "Smarty's Chat Viewer",
    appDescription: 'Professional WhatsApp conversation management for customer support teams',
    welcomeTitle: 'Welcome to Customer Chat',
    welcomeDescription: 'Connect with your customers seamlessly through our powerful chat platform.',
    loginButton: 'Access Team Portal',
    manageConversations: 'Manage customer conversations',
    trackAnalytics: 'Track conversation analytics', 
    realTimeUpdates: 'Real-time message updates',
    
    // Conversations
    searchConversations: 'Search conversations...',
    noConversations: 'No conversations found',
    noConversationsText: 'Start a conversation to see it here.',
    messages: 'messages',
    
    // Chat area
    selectConversation: 'Select a conversation',
    selectConversationText: 'Choose a conversation from the list to start chatting.',
    loadingMessages: 'Loading messages...',
    exportChat: 'Export',
    typeMessage: 'Type your message...',
    send: 'Send',
    loadPrevious: 'Load Previous Messages',
    
    // User info panel
    selectConversationDetails: 'Select a conversation to view user details',
    noUserInfo: 'No user information available',
    customer: 'Customer',
    contactInformation: 'Contact Information',
    phoneNumber: 'Phone Number',
    userId: 'User ID',
    aiAgentControl: 'AI Agent Control',
    aiAgentStatus: 'AI Agent Status',
    aiResponsesEnabled: 'AI responses enabled',
    aiResponsesDisabled: 'AI responses disabled',
    templateActions: 'Template Actions',
    chooseTemplate: 'Choose a template to send to the customer',
    vehicleRegistration: 'Vehicle Registration',
    noResponse24h: '24hr No Response',
    conversationStats: 'Conversation Stats',
    totalMessages: 'Total Messages',
    
    // Toast messages
    error: 'Error',
    success: 'Success',
    failedToUpdateAgent: 'Failed to update AI agent status. Please try again.',
    agentEnabled: 'AI agent enabled for this user',
    agentDisabled: 'AI agent disabled for this user',
    templateSent: 'Template Sent',
    templateSentDescription: 'has been sent to the customer',
    failedToSendTemplate: 'Failed to send template. Please try again.',
    noPhoneNumber: 'No phone number available for this user',
    
    // Admin
    adminDashboard: 'Admin Dashboard',
    userManagement: 'User Management',
    accessDenied: 'Access Denied',
    adminOnly: 'This area is restricted to administrators only.',
    notAdmin: 'You do not have administrator privileges.',
    loading: 'Loading...',
    inviteNewUsers: 'Invite New Users',
  },
  de: {
    // Navigation
    signOut: 'Abmelden',
    dashboard: 'Dashboard',
    conversations: 'Gespräche',
    welcome: 'Willkommen',
    
    // Landing page
    appTitle: "Smarty's Chat Viewer",
    appDescription: 'Professionelle WhatsApp-Gesprächsverwaltung für Kundensupport-Teams',
    welcomeTitle: 'Willkommen bei Customer Chat',
    welcomeDescription: 'Verbinden Sie sich nahtlos mit Ihren Kunden über unsere leistungsstarke Chat-Plattform.',
    loginButton: 'Team-Portal betreten',
    manageConversations: 'Kundengespräche verwalten',
    trackAnalytics: 'Gesprächsanalysen verfolgen',
    realTimeUpdates: 'Echtzeit-Nachrichten-Updates',
    
    // Conversations
    searchConversations: 'Gespräche suchen...',
    noConversations: 'Keine Gespräche gefunden',
    noConversationsText: 'Starten Sie ein Gespräch, um es hier zu sehen.',
    messages: 'Nachrichten',
    
    // Chat area
    selectConversation: 'Gespräch auswählen',
    selectConversationText: 'Wählen Sie ein Gespräch aus der Liste, um zu chatten.',
    loadingMessages: 'Nachrichten werden geladen...',
    exportChat: 'Exportieren',
    typeMessage: 'Nachricht eingeben...',
    send: 'Senden',
    loadPrevious: 'Vorherige Nachrichten laden',
    
    // User info panel
    selectConversationDetails: 'Wählen Sie ein Gespräch aus, um Benutzerdetails anzuzeigen',
    noUserInfo: 'Keine Benutzerinformationen verfügbar',
    customer: 'Kunde',
    contactInformation: 'Kontaktinformationen',
    phoneNumber: 'Telefonnummer',
    userId: 'Benutzer-ID',
    aiAgentControl: 'KI-Agent Kontrolle',
    aiAgentStatus: 'KI-Agent Status',
    aiResponsesEnabled: 'KI-Antworten aktiviert',
    aiResponsesDisabled: 'KI-Antworten deaktiviert',
    templateActions: 'Vorlagen-Aktionen',
    chooseTemplate: 'Wählen Sie eine Vorlage zum Senden an den Kunden',
    vehicleRegistration: 'Fahrzeugregistrierung',
    noResponse24h: '24h keine Antwort',
    conversationStats: 'Gesprächsstatistiken',
    totalMessages: 'Nachrichten insgesamt',
    
    // Toast messages
    error: 'Fehler',
    success: 'Erfolg',
    failedToUpdateAgent: 'Fehler beim Aktualisieren des KI-Agent-Status. Bitte versuchen Sie es erneut.',
    agentEnabled: 'KI-Agent für diesen Benutzer aktiviert',
    agentDisabled: 'KI-Agent für diesen Benutzer deaktiviert',
    templateSent: 'Vorlage gesendet',
    templateSentDescription: 'wurde an den Kunden gesendet',
    failedToSendTemplate: 'Fehler beim Senden der Vorlage. Bitte versuchen Sie es erneut.',
    noPhoneNumber: 'Keine Telefonnummer für diesen Benutzer verfügbar',
    
    // Admin
    adminDashboard: 'Admin Dashboard',
    userManagement: 'Benutzerverwaltung',
    accessDenied: 'Zugriff verweigert',
    adminOnly: 'Dieser Bereich ist nur für Administratoren zugänglich.',
    notAdmin: 'Sie haben keine Administratorrechte.',
    loading: 'Wird geladen...',
    inviteNewUsers: 'Neue Benutzer einladen',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('de');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};