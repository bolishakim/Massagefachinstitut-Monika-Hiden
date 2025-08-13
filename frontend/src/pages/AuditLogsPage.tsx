import React, { useState, useEffect } from 'react';
import { 
  Search,
  Filter,
  Eye,
  Shield,
  AlertTriangle,
  Activity,
  Clock,
  User,
  Database,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trash2
} from 'lucide-react';
import { H2, H3, TextMD } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { apiService } from '../services/api';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  tableName: string;
  recordId?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface GDPRAuditLog {
  id: string;
  userId?: string;
  action: string;
  dataType: string;
  recordId?: string;
  purpose: string;
  legalBasis?: string;
  ipAddress?: string;
  userAgent?: string;
  automated: boolean;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  userId?: string;
  userName?: string;
  ipAddress?: string;
  timestamp: string;
  details: any;
}

interface PatientAccessReport {
  patientId: string;
  patientName: string;
  accessCount: number;
  lastAccessed: string;
  accessedBy: Array<{
    userId: string;
    userName: string;
    role: string;
    accessCount: number;
    lastAccessed: string;
  }>;
}

export function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [gdprLogs, setGdprLogs] = useState<GDPRAuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [patientAccessReport, setPatientAccessReport] = useState<PatientAccessReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    action: '',
    resource: '',
    ipAddress: '',
  });

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Dynamic filter options
  const [filterOptions, setFilterOptions] = useState({
    audit: {
      actions: [{ value: '', label: 'All Actions' }],
      resources: [{ value: '', label: 'All Resources' }],
      users: [{ value: '', label: 'All Users' }]
    },
    gdpr: {
      actions: [{ value: '', label: 'All Actions' }],
      dataTypes: [{ value: '', label: 'All Data Types' }],
      users: [{ value: '', label: 'All Users' }]
    }
  });

  const tabs = [
    { id: 'audit', label: 'System Audit Logs', icon: Activity, count: auditLogs.length },
    { id: 'gdpr', label: 'GDPR Audit Logs', icon: Shield, count: gdprLogs.length },
    { id: 'security', label: 'Security Events', icon: AlertTriangle, count: securityEvents.length },
    { id: 'patient-access', label: 'Patient Access Report', icon: User, count: patientAccessReport.length },
  ];

  // Load filter options from API
  const loadFilterOptions = async () => {
    try {
      const [auditOptions, gdprOptions] = await Promise.all([
        apiService.get('/audit/filter-options/audit'),
        apiService.get('/audit/filter-options/gdpr')
      ]);

      if (auditOptions.success) {
        setFilterOptions(prev => ({
          ...prev,
          audit: {
            actions: [{ value: '', label: 'All Actions' }, ...auditOptions.data.actions],
            resources: [{ value: '', label: 'All Resources' }, ...auditOptions.data.resources],
            users: [{ value: '', label: 'All Users' }, ...auditOptions.data.users]
          }
        }));
      }

      if (gdprOptions.success) {
        setFilterOptions(prev => ({
          ...prev,
          gdpr: {
            actions: [{ value: '', label: 'All Actions' }, ...gdprOptions.data.actions],
            dataTypes: [{ value: '', label: 'All Data Types' }, ...gdprOptions.data.dataTypes],
            users: [{ value: '', label: 'All Users' }, ...gdprOptions.data.users]
          }
        }));
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, currentPage, filters]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case 'audit':
          await loadAuditLogs();
          break;
        case 'gdpr':
          await loadGDPRLogs();
          break;
        case 'security':
          await loadSecurityEvents();
          break;
        case 'patient-access':
          await loadPatientAccessReport();
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: pageSize.toString(),
      ...filters,
    });

    const response = await apiService.get(`/audit/logs/enhanced?${params}`);
    if (response.success) {
      setAuditLogs(response.data.logs);
      setTotalPages(response.data.pagination.pages);
    }
  };

  const loadGDPRLogs = async () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: pageSize.toString(),
      ...filters,
    });

    const response = await apiService.get(`/audit/logs/gdpr?${params}`);
    if (response.success) {
      setGdprLogs(response.data.logs);
      setTotalPages(response.data.pagination.pages);
    }
  };

  const loadSecurityEvents = async () => {
    const response = await apiService.get('/audit/security-events?hours=168'); // Last week
    if (response.success) {
      setSecurityEvents(response.data);
    }
  };

  const loadPatientAccessReport = async () => {
    const response = await apiService.get('/audit/reports/patient-access?days=30');
    if (response.success) {
      setPatientAccessReport(response.data);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userId: '',
      action: '',
      resource: '',
      ipAddress: '',
    });
    setCurrentPage(1);
  };

  const exportLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...filters,
        limit: '10000', // Large limit for export
      });

      const endpoint = activeTab === 'gdpr' ? '/audit/logs/gdpr' : '/audit/logs/enhanced';
      const response = await apiService.get(`${endpoint}?${params}`);
      
      if (response.success) {
        const dataStr = JSON.stringify(response.data.logs, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeTab}-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export logs');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('de-DE');
  };

  const renderAuditLogs = () => (
    <div className="space-y-4">
      {auditLogs.map((log) => (
        <Card key={log.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant={log.action === 'DELETE' ? 'destructive' : 'secondary'}>
                  {log.action}
                </Badge>
                <span className="text-sm font-medium">{log.tableName}</span>
                {log.recordId && (
                  <span className="text-sm text-muted-foreground">ID: {log.recordId.slice(0, 8)}...</span>
                )}
              </div>
              
              <p className="text-sm mb-2">{log.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Unknown'}
                </span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTimestamp(log.createdAt)}
                </span>
                {log.ipAddress && (
                  <span>IP: {log.ipAddress}</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderGDPRLogs = () => (
    <div className="space-y-4">
      {gdprLogs.map((log) => (
        <Card key={log.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline">
                  {log.action}
                </Badge>
                <span className="text-sm font-medium">{log.dataType}</span>
                {log.automated && (
                  <Badge variant="secondary" className="text-xs">
                    Automated
                  </Badge>
                )}
              </div>
              
              <p className="text-sm mb-2">{log.purpose}</p>
              {log.legalBasis && (
                <p className="text-xs text-muted-foreground mb-2">
                  Legal Basis: {log.legalBasis}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                </span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTimestamp(log.createdAt)}
                </span>
                {log.ipAddress && (
                  <span>IP: {log.ipAddress}</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderSecurityEvents = () => (
    <div className="space-y-4">
      {securityEvents.map((event) => (
        <Card key={event.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${getSeverityColor(event.severity)}`} />
                <Badge variant="outline">
                  {event.type}
                </Badge>
                <Badge variant={event.severity === 'CRITICAL' ? 'destructive' : 'secondary'}>
                  {event.severity}
                </Badge>
              </div>
              
              <p className="text-sm mb-2">{event.description}</p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                {event.userName && (
                  <span className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {event.userName}
                  </span>
                )}
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTimestamp(event.timestamp)}
                </span>
                {event.ipAddress && (
                  <span>IP: {event.ipAddress}</span>
                )}
              </div>
              
              {event.details && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer">Show Details</summary>
                  <pre className="text-xs mt-2 p-2 bg-muted rounded">
                    {JSON.stringify(event.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderPatientAccessReport = () => (
    <div className="space-y-4">
      {patientAccessReport.map((report) => (
        <Card key={report.patientId} className="p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{report.patientName}</h4>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {report.accessCount} accesses
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Last: {formatTimestamp(report.lastAccessed)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Accessed By:</h5>
            {report.accessedBy.map((accessor) => (
              <div key={accessor.userId} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center space-x-2">
                  <User className="w-3 h-3" />
                  <span className="text-sm">{accessor.userName}</span>
                  <Badge variant="secondary" className="text-xs">
                    {accessor.role}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {accessor.accessCount} times • Last: {formatTimestamp(accessor.lastAccessed)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading audit data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Card className="p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive">{error}</p>
          <Button onClick={loadData} className="mt-4">
            Try Again
          </Button>
        </Card>
      );
    }

    switch (activeTab) {
      case 'audit':
        return renderAuditLogs();
      case 'gdpr':
        return renderGDPRLogs();
      case 'security':
        return renderSecurityEvents();
      case 'patient-access':
        return renderPatientAccessReport();
      default:
        return null;
    }
  };

  const renderFilters = () => (
    <Card className="p-4 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <Input
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            style={{ width: '140px' }}
          />
        </div>
        <div className="min-w-0">
          <Input
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            style={{ width: '140px' }}
          />
        </div>
        <div className="min-w-0">
          <Select
            label="Action"
            options={activeTab === 'gdpr' ? filterOptions.gdpr.actions : filterOptions.audit.actions}
            value={filters.action}
            onChange={(value) => handleFilterChange('action', value)}
            style={{ width: '160px' }}
          />
        </div>
        {(activeTab === 'audit' || activeTab === 'gdpr') && (
          <div className="min-w-0">
            <Select
              label={activeTab === 'gdpr' ? 'Data Type' : 'Resource'}
              options={activeTab === 'gdpr' ? filterOptions.gdpr.dataTypes : filterOptions.audit.resources}
              value={filters.resource}
              onChange={(value) => handleFilterChange('resource', value)}
              style={{ width: '160px' }}
            />
          </div>
        )}
        {(activeTab === 'audit' || activeTab === 'gdpr') && (
          <div className="min-w-0">
            <Select
              label="User"
              options={activeTab === 'gdpr' ? filterOptions.gdpr.users : filterOptions.audit.users}
              value={filters.userId}
              onChange={(value) => handleFilterChange('userId', value)}
              style={{ width: '200px' }}
            />
          </div>
        )}
        <div className="min-w-0">
          <Input
            label="IP Address"
            placeholder="Filter by IP..."
            value={filters.ipAddress}
            onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
            style={{ width: '120px' }}
          />
        </div>
        <div className="flex items-center space-x-2 ml-auto">
          <Button variant="outline" onClick={clearFilters} size="sm">
            Clear
          </Button>
          <Button variant="outline" onClick={exportLogs} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <H2>Audit & Security Logs</H2>
          <TextMD className="text-muted-foreground">
            Monitor system access, GDPR compliance, and security events
          </TextMD>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters */}
      {(activeTab === 'audit' || activeTab === 'gdpr') && renderFilters()}

      {/* Content */}
      {renderContent()}

      {/* Pagination */}
      {(activeTab === 'audit' || activeTab === 'gdpr') && renderPagination()}
    </div>
  );
}