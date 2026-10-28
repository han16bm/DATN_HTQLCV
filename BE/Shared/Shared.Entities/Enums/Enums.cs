namespace Shared.Entities.Enums;

public enum SystemRole { Employee, Manager, Admin }
public enum UserStatus { Active, Locked }
public enum OrgStatus { Active, Inactive }

public enum ProjectStatus { Planned, Active, Completed, Cancelled }
public enum ProjectRole { Owner, Manager, Member }

public enum TaskPriority { Low, Normal, High, Urgent }
public enum WorkTaskStatus { New, Todo, InProgress, PendingReview, Completed, Cancelled }

public enum TimeLogStatus { Active, Void }

public enum SubmissionStatus { Pending, Accepted, RevisionRequested }

public enum PeriodType { Daily, Weekly }
public enum ReportStatus { Draft, Submitted }

public enum AttachmentStatus { Ready, Rejected }

public enum AlertType { DeadlineRisk, Overdue, Workload, Bottleneck, DataQuality }
public enum AlertSeverity { Info, Low, Medium, High, Critical }
public enum AlertStatus { Unread, Read, InProgress, Resolved, Dismissed }
