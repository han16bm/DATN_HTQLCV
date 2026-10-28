# Quy ước code Backend

Áp dụng cho toàn bộ `BE/`. Mọi service mới, controller mới, class mới phải theo đúng các quy ước dưới đây để codebase đồng nhất.

## 1. Kiến trúc tổng thể

Microservices trên ASP.NET Core 8, mỗi domain nghiệp vụ là một Web API độc lập, đứng sau một API Gateway (YARP) duy nhất là cổng vào công khai (`/api/*`). Các service không gọi thẳng nhau qua HTTP nội bộ trừ khi thực sự cần (ví dụ Gateway forward, hoặc một service cần tra cứu nhãn hiển thị tối thiểu từ service khác).

```
BE/
  Gateway/                     YARP reverse proxy, JWT forward, CORS, rate limit
  Shared/
    Shared.Commons/            Exceptions, Result/PagingDto, Attributes, Extensions, Utils dùng chung
    Shared.Entities/           DbContext + toàn bộ entity EF Core dùng chung
  Services/
    Identity.Api/              Tài khoản, đơn vị, nhóm, đăng nhập (UC-A01–A05)
    Projects.Api/               Dự án, thành viên, phân quyền dự án (UC-P01–P05)
    Tasks.Api/                  Công việc, thời gian, kết quả, báo cáo (UC-T01–T11)
    Analytics.Api/              Bảng tổng quan, phân tích, cảnh báo (UC-D01–D06)
  docs/
    CODING_STYLE.md            File này
```

Mỗi service dưới `Services/` có cấu trúc thư mục giống hệt nhau (xem mục 3). Đặt entity và DbContext dùng chung trong `Shared.Entities` vì các service chia sẻ cùng một cơ sở dữ liệu quan hệ ở giai đoạn này — tách database theo service là việc của giai đoạn sau, không phải base ban đầu.

## 2. Đặt tên

- Namespace, thư mục, lớp: PascalCase tiếng Anh, khớp đúng domain model đã chốt trong `FE/fe-specs/api/DTO_MODELS.md` và `API_CATALOG.md`. Không dịch field sang tiếng Việt, không tự đặt tên khác hợp đồng đã chốt với FE.
- Entity số nhiều khi là `DbSet`: `DbSet<Project> Projects`, `DbSet<ProjectMembership> ProjectMemberships`.
- DTO theo hậu tố rõ vai trò, không dùng chung một kiểu cho nhiều mục đích:
  - `<Entity>Dto` — response đọc.
  - `<Entity>CreateRequest` — body tạo mới.
  - `<Entity>PatchRequest` — body cập nhật một phần; chỉ field được phép sửa, không `Partial<EntityDto>`.
  - `<Entity>Query` — query string, kế thừa `PagingQuery` khi có phân trang.
- Route và field JSON: camelCase, khớp chính xác `API_CATALOG.md`. Route là danh từ số nhiều kiểu REST (`/api/projects`, `/api/projects/{projectId}/members`), **không** dùng động từ tiếng Việt kiểu `tim-kiem`/`chi-tiet`.
- Interface service: `I<Entity>Service`, implementation `<Entity>Service`.
- Enum: PascalCase, giá trị khớp đúng enum trong DTO_MODELS.md (`ProjectStatus.Planned`, serialize ra `"PLANNED"` qua `JsonStringEnumConverter` với naming policy upper-snake khi cần, hoặc map thủ công nếu enum không chia theo convention chuẩn).

## 3. Cấu trúc một service API

```
<Service>.Api/
  Constants/
  Controllers/
    BaseApiController.cs
    <Entity>Controller.cs
  Extensions/
    ServiceRegistrationExtensions.cs   AddDependencyInjection(...)
    CorsConfigurationExtensions.cs
  Filters/
    LogExceptionFilter.cs
  Interfaces/
    I<Entity>Service.cs
  Models/
    Requests/<Entity>CreateRequest.cs, <Entity>PatchRequest.cs
    Queries/<Entity>Query.cs
    Dtos/<Entity>Dto.cs
  Services/
    <Entity>Service.cs
  Program.cs
  appsettings.json
```

Controller mỏng: chỉ nhận request, gọi đúng một phương thức service, trả thẳng kết quả. Không viết logic nghiệp vụ, không truy vấn `DbContext` trong controller.

**Không dùng cú pháp expression-bodied (`=>`) cho action, method service, hay bất kỳ phương thức nào có bước gọi/xử lý thật** — kể cả khi chỉ một dòng. Luôn viết block body đầy đủ với `{ }` và `return` tường minh. Lý do: khi đọc nhanh một danh sách action hoặc một service dài, dòng `=>` dồn chữ ký, từ khóa `await`, và giá trị trả về vào một dòng làm khó quét mắt và khó đặt breakpoint. Ngoại lệ duy nhất được phép: property getter một dòng không có logic (`DbSet<T> X => Set<T>()`, hằng số tính toán đơn giản) và static factory cực ngắn trong `Shared.Commons` (`GuidGenerator.NewId() => ...`).

```csharp
[Audit]
[ApiController]
[Route("api/projects")]
public class ProjectsController : BaseApiController
{
    private readonly IProjectService _projectService;

    public ProjectsController(ILogger<BaseApiController> logger, IProjectService projectService) : base(logger)
    {
        _projectService = projectService;
    }

    [HttpGet]
    public async Task<object> List([FromQuery] ProjectQuery query)
    {
        return await _projectService.ListAsync(query);
    }

    [HttpPost]
    public async Task<object> Create([FromBody] ProjectCreateRequest request)
    {
        return await _projectService.CreateAsync(request);
    }
}
```

Service implement interface, kế thừa `BaseService<TEntity>` khi cần ghi audit log, thao tác trực tiếp trên `ApplicationDbContext` — không thêm lớp Repository trung gian ở base này.

## 4. Response envelope

Mọi action controller trả `Task<object>`. `[Audit]` attribute (đặt ở `BaseApiController` hoặc từng controller) tự bọc kết quả thành `Result<T>` và luôn trả HTTP 200:

```json
{ "succeeded": true, "errors": null, "data": { ... }, "traceId": "...", "statusCode": 100200 }
```

Lỗi nghiệp vụ/validate cũng trả HTTP 200 với `succeeded:false` và `errors` — **không** dùng mã 4xx/5xx cho lỗi nghiệp vụ. Chỉ các lỗi ở biên bảo mật (thiếu/sai API key, chưa xác thực tại Gateway) mới trả mã HTTP thật (401/403).

Ngoại lệ dùng để báo lỗi nghiệp vụ, không dùng `return null`/magic string. Ném đúng loại kế thừa `AppException` (`NotFoundException`, `BusinessRuleException`, `ForbiddenException`, `ValidationException`…) với `ErrorCode` tương ứng trong `ErrorCodes`. `[Audit]` bắt toàn bộ exception chưa xử lý và chuyển thành `Result<T>` lỗi.

## 5. Phân trang

Query kế thừa `PagingQuery` (`page`, `pageSize`, mặc định 1/20, tối đa `pageSize` 100). Response danh sách dùng `PagedResult<T>` (`items`, `page`, `pageSize`, `total`) — khớp `PageDTO<T>` phía FE.

## 6. Version & concurrency

Entity có `Version` (rowversion/số nguyên tăng) cho các API yêu cầu `If-Match` theo đúng `API_CATALOG.md`. Thiếu `If-Match` ở API bắt buộc → 428; version cũ → 412. Không optimistic update phía FE — BE luôn là nguồn version chính thức, kiểm tra trước khi ghi.

## 7. Exception

Toàn bộ exception nghiệp vụ kế thừa `AppException(string message, int errorCode)` trong `Shared.Commons/Exceptions`. Không ném `Exception` trần, không dùng exception cho luồng điều khiển thông thường (ví dụ kiểm tra tồn tại trước rồi `if` thay vì try/catch khi có thể tránh).

## 8. Audit & lịch sử

Mọi thao tác tạo/sửa/xoá/đổi trạng thái có ý nghĩa nghiệp vụ phải ghi lịch sử qua `BaseService<T>.WriteAuditLog(...)` trong cùng transaction với thay đổi dữ liệu — không ghi log sau khi đã `SaveChanges` thành công riêng lẻ (tránh mất log khi service crash giữa chừng).

## 9. Comment

Chỉ comment khi cần giải thích **lý do** một đoạn code tồn tại hoặc một ràng buộc không hiển nhiên từ tên biến/hàm (ví dụ: vì sao bỏ qua một điều kiện, một giới hạn nghiệp vụ không thấy được từ chữ ký hàm). Không viết comment mô tả lại những gì code đã nói rõ, không viết doc comment nhiều dòng cho hàm đơn giản, không để lại comment kiểu nhật ký thay đổi. Một dòng là đủ; không đoạn văn.

```csharp
// Đóng dự án phải chặn khi còn task mở hoặc kết quả chờ xét — không chỉ dựa vào status dự án
if (await HasOpenWorkAsync(projectId))
    throw new BusinessRuleException("Dự án còn công việc mở hoặc kết quả chờ xét.", ErrorCodes.BusinessRule);
```

## 10. Validate & whitelist

Request DTO là `record` với field strict theo đúng whitelist trong `API_CATALOG.md` — không nhận thừa field, không dùng `Partial<EntityDto>` làm body cập nhật. Validate bằng DataAnnotations trên chính record hoặc FluentValidation khi điều kiện phức tạp hơn thuộc tính đơn lẻ (ví dụ so sánh hai field). `[Audit]` tự chuẩn hoá lỗi `ModelState` về `Result<T>`.

## 11. Thời gian

Lưu mọi mốc sự kiện bằng UTC (`DateTimeOffset` hoặc `DateTime` Kind=Utc). Ngày làm việc/kỳ báo cáo (workDate, periodStart) là `DateOnly`, diễn giải theo giờ Việt Nam ở tầng nghiệp vụ, không trộn với mốc UTC trong cùng một phép so sánh mà không quy đổi.

## 12. Dependency Injection

Một điểm đăng ký duy nhất mỗi service: `ServiceRegistrationExtensions.AddDependencyInjection(...)` — liệt kê phẳng toàn bộ `IXxxService → XxxService` dạng `Scoped`. `Program.cs` gọi đúng một lần, không rải `AddScoped` rải rác nhiều nơi.

## 13. Những điều không làm

- Không gọi `DbContext` trực tiếp trong Controller.
- Không trả lỗi nghiệp vụ bằng mã HTTP 4xx/5xx (xem mục 4).
- Không optimistic update, không tự suy luận field chỉ-đọc ở FE rồi gửi lại cho BE.
- Không dùng chung một enum trạng thái cho nhiều entity khác nhau.
- Không thêm Repository/UnitOfWork layer ở bản base này.
- Không viết comment dài dòng, không để code chết (commented-out code).
