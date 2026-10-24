# Quy tắc Zod, chuẩn hóa và trường thay đổi

## API nào dùng Zod

**Tất cả 79 API đều dùng Zod tại ranh giới dữ liệu.** Codex phải tạo params, query, body và response schema cho từng contract theo bảng DTO. GET không có body nghiệp vụ; params/query vẫn được kiểm tra dù object rỗng. Mutation JSON/multipart có thêm body validation. Error JSON dùng ErrorSchema. Success JSON dùng successEnvelope(response schema).

Ngoại lệ về response: `downloadAttachment` trả binary. API này kiểm tra ID bằng Zod và kiểm tra error JSON bằng ErrorSchema; success dùng HTTP status, Content-Type và Blob, không JSON.parse hoặc ép file thành object Zod. Upload kiểm tra File/metadata và policy trước khi gửi, BE vẫn kiểm tra nội dung và tính hợp lệ của tệp.

| Nhóm | Params/query | Form/body | Response | Điều kiện theo dữ liệu hiện tại |
|---|---|---|---|---|
| Login/refresh/logout/me | Object đúng contract | LoginSchema; command body rỗng | LoginResponse/Session/Ok | Phiên, khóa tài khoản, giới hạn đăng nhập do BE |
| Users | ID, filter trạng thái/đơn vị/vai trò | Create/Patch/Lock/Reset schema riêng | User/Ok/Page<User> | Duy nhất, cấp quyền, bàn giao trước khóa |
| Organization | ID, page, đơn vị | Unit/Team và members schema riêng | Unit/Team/Page | Chu trình, đơn vị hoạt động, thành viên hợp lệ |
| Projects/members | ID đúng tầng tài nguyên | Schema create/patch/permissions/command | Project/Membership/Closure | Duy trì owner, thời hạn, quyền và điều kiện kết thúc |
| Tasks | ID, status/priority/deadline/overdue/page | Create/Patch/Assign/Remaining và command riêng | Task/Page/Audit | Trạng thái, người nhận, hạn dự án, lý do đổi kế hoạch |
| Time logs | Task/log ID, page | Create/Patch/Void | TimeLog + Task | Phân công, ngày Việt Nam, tổng phút/ngày, quyền sở hữu |
| Submissions/reviews | Task/submission ID, page | Nộp, chấp nhận, yêu cầu sửa có schema riêng | Submission + Task | Lần mới nhất, không tự duyệt, giờ công và minh chứng |
| Reports | Project, kỳ, tác giả, trạng thái | CreateDraft/PatchDraft/Submit | Report/Preview | Trùng kỳ, thứ Hai, tác giả, nội dung gửi, số liệu 0 |
| Attachments | Attachment ID | Multipart UploadSchema + policy | Policy/Attachment; download binary | Loại/dung lượng, chủ tệp, task, trạng thái READY |
| Analytics/detail/jobs | Phạm vi, ngày, analysisId/jobId | AnalysisJobCreateSchema | Dashboard/Risks/Workload/Bottlenecks/Summary/Detail/Job | Quyền, snapshot/citation, missing data, state và generation policy |
| Alerts | ID, filter | AlertPatchSchema | Alert/Page | Quyền xử lý, ghi chú, không sửa dữ liệu nguồn |

Danh sách theo từng operation nằm trong `api/API_CATALOG.md` và `api/ZOD_REACT_QUERY_MATRIX.md`. Không có nhóm “tin DTO vì TypeScript nên bỏ parse response”. TypeScript không kiểm tra JSON lúc chạy.

## Bốn bước xử lý dữ liệu

1. **Form schema:** nhận giá trị do control tạo ra. Ví dụ số phút đang là string, datetime-local chưa có múi giờ. React Hook Form dùng `z.input` cho đầu vào và `z.output` cho kết quả đã transform.
2. **Mapper:** chỉ chuyển trường cho phép; chuyển giờ Việt Nam sang UTC và chuỗi số thành số nguyên. Không thay đổi các ID/trạng thái do server quản lý.
3. **Request DTO schema:** strict object, kiểm tra payload cuối ngay trước request. Create, patch và command dùng schema khác nhau.
4. **Response schema:** xác minh envelope, trường cần thiết, enum, kiểu và khả năng null trước khi dữ liệu vào cache. Response thêm field được bỏ qua ở các object mặc định của Zod; field bắt buộc sai hoặc thiếu phải thành ContractError.

Refinement dựa trên giá trị khác trong payload dùng refine/superRefine phù hợp. Điều kiện phụ thuộc TaskDTO hoặc project/session hiện tại dùng policy có context, ví dụ `validateTaskPlanChange`; BE kiểm tra lại trong giao dịch. Không biến dữ liệu cached thành bằng chứng đủ quyền thực hiện.

## Chuẩn hóa theo trường

| Trường/loại | Thực hiện | Không thực hiện |
|---|---|---|
| title, name, displayName, summary, reason | Trim đầu/cuối; kiểm tra độ dài theo schema | Đổi nội dung/ý nghĩa hoặc tự điền lý do |
| username | Trim; giữ nguyên quy ước chữ hoa/thường đã chốt | Tự lowercase nếu BE chưa thống nhất |
| email | Trim rồi lowercase trước khi kiểm tra định dạng trong request | Sửa email hợp lệ trả từ server để che dữ liệu lỗi |
| password, initialPassword, temporaryPassword | Giữ đúng chuỗi người dùng nhập, kiểm tra độ dài theo loại thao tác | Trim, lowercase, ghi log, lưu trong Query/Zustand persist |
| estimatedMinutes, remainingMinutes, minutes | Input rỗng là lỗi/chưa nhập; parse số nguyên; kiểm tra miền giá trị | `Number('')` hoặc coerce rỗng thành 0 |
| dueAt | Bắt buộc đủ ngày và giờ; datetime-local được hiểu theo Asia/Ho_Chi_Minh và đổi sang UTC | Sử dụng múi giờ máy của người dùng ngầm định hoặc tự chọn 00:00 |
| workDate, periodStart | Giữ `YYYY-MM-DD` theo Việt Nam | toISOString làm ngày bị dịch khi qua UTC |
| from/to analytics | Khoảng ngày bao gồm hai ngày; từ ngày không sau đến ngày | Dùng kỳ lọc để ghi đè dữ liệu gốc |
| dueFrom/dueTo | ISO UTC, so sánh deadline trong khoảng | Lẫn với workDate hoặc ngày lập báo cáo |
| overdue trên URL | Chỉ nhận literal `true`/`false`; chuyển đúng boolean | z.coerce.boolean trên string `false` |
| page/pageSize | Chuỗi số trên URL → số nguyên; mặc định 1/20, tối đa 100 | Tự gửi offset khi contract đang dùng page |
| links | URL HTTP/HTTPS, số lượng theo schema | Thực thi URL javascript/data hoặc coi liên kết là lệnh |
| permissions/memberIds/attachmentIds | Mảng ID/enum, kiểm tra trùng, kiểm tra phạm vi tại BE | Gửi boolean form thay mảng nếu DTO cần mảng |
| status | Chỉ API command có quyền được đổi theo state machine | Đưa status vào TaskPatch hoặc tự đặt Hoàn thành |
| actualMinutes/riskLevel/snapshot/handledBy/createdAt/version | Đọc từ response; gửi version qua If-Match nếu yêu cầu | Gửi lại trong body để tự ghi đè server |

## Quy ước PATCH, null và dữ liệu thay đổi

PATCH phải có ít nhất một trường nghiệp vụ thay đổi. Chỉ có `reason` hoặc `changeReason` không được coi là một thay đổi hợp lệ. Chỉ gửi dirty fields sau khi so sánh với bản đã đọc; tránh gửi toàn bộ form khi các trường không đổi.

| Trường cho phép xóa/liên kết | Giá trị để xóa | Ví dụ |
|---|---|---|
| task.description | null hoặc chuỗi rỗng theo nhu cầu hiển thị | `{description:null}` |
| unit.parentId, unit.managerId | null | `{parentId:null,reason:'Tách đơn vị'}` |
| report.zeroTimeReason trong nháp | null | `{zeroTimeReason:null}` |
| report.achievements/blockers/nextPlan trong nháp | chuỗi rỗng | Cho lưu nháp thiếu nội dung; submit kiểm tra lại |
| team.memberIds | `[]` qua replaceTeamMembers | Bỏ toàn bộ thành viên, có reason |
| submission.links, attachmentIds khi nộp | `[]` | Minh chứng tùy chọn; summary vẫn bắt buộc |
| Field không nullable khác | Không chấp nhận null | title, dueAt, assigneeId của lệnh phân công |

`undefined` nghĩa là không gửi/không đổi, không tương đương null. Không dùng JSON.stringify response để tạo body. Không cho phép xóa assignee bằng patch; nếu có nhu cầu bỏ phân công, phải đặc tả một thao tác riêng trước.

## Điều kiện cho từng thay đổi nghiệp vụ

| Thao tác | FE kiểm tra trước | BE/mock kiểm tra khi nhận |
|---|---|---|
| Tạo công việc | Trường bắt buộc, phút >0, deadline hợp lệ theo dự án đã đọc | Dự án ACTIVE, deadline sau serverTime và ≤ hạn dự án |
| Sửa công việc | Whitelist; đổi hạn/dự kiến sau giao cần changeReason | Trạng thái và version mới nhất; giữ kế hoạch gốc và audit |
| Giao/bàn giao | Người được chọn, lý do bàn giao | Thành viên/tài khoản hoạt động, một phân công hiện tại |
| Bắt đầu/tạm dừng | Action hợp trạng thái và lý do khi tạm dừng | Người nhận hiện tại, dự án ACTIVE, chuyển trạng thái hợp lệ |
| Ghi/sửa giờ | Số nguyên dương ≤1440; ngày hợp lệ, reason khi sửa/void | Tổng mọi công việc của người/ngày; tư cách phân công và quyền sở hữu |
| Nộp kết quả | Summary; upload READY; links hợp lệ | Có giờ hợp lệ; không có lần đang chờ; giữ hạn/giờ tại lúc nộp |
| Chấp nhận/yêu cầu sửa | Quyền UI; người xét khác người nộp; yêu cầu sửa có hai nội dung | Lần mới nhất chưa xét; atomically lưu quyết định và Task status |
| Gửi báo cáo | Achievements và nextPlan không rỗng; lý do nếu tổng preview 0 | Tính lại số liệu tại lúc gửi, kỳ/ID hợp lệ, không trùng và đóng snapshot |
| Đóng dự án | Hiện closure checks và cảnh báo chặn | Kiểm tra lại việc mở, chờ xét, báo cáo cần gửi trong giao dịch |
| Cấp quyền | Chỉ render tập quyền được cấp | Không vượt thẩm quyền; OWNER thay qua kế hoạch dự án |
| Xử lý cảnh báo | Status đúng enum, note theo điều kiện | Không đổi bằng chứng/conditionActive/công việc gốc |

## Lỗi và ánh xạ vào form

422 có fieldErrors `{path:string[],message}`. Adapter form chỉ setError với tên field đã có; lỗi lạ đưa vào form-level message. 412 giữ dữ liệu đang nhập và cho tải bản mới; 409 hiển thị nguyên nhân nghiệp vụ. 401 kết thúc phiên hoặc đi qua refresh flow được chốt; 403 không retry để vượt quyền. Network/5xx giữ draft và cho thử lại cùng Idempotency-Key nếu payload không đổi.

Không ghi thành công vào cache khi response schema lỗi. Sau ContractError trên mutation, kết quả có thể đã được BE lưu: đọc lại tài nguyên hoặc thử lại cùng key, không tạo thao tác mới bằng key khác.

## Bổ sung Zod cho LLM và read projection (0.3.0)

Request createAnalysisJob chỉ nhận analysisId, generationMode, locale. Các field analysisType/projectId/from/to cũ không còn được gửi; dữ liệu nguồn, model, API key và prompt không thuộc request DTO. Zod strict từ chối các field đó.

getAnalysisDetail kiểm tra response schema và các refinement tại cuối DTO_MODELS.md: subject union, metric/evidence refs, analysisId/snapshotId nhất quán, job/explanation state, freshness/generation. Không chỉ parse một field narrative rồi bỏ qua số liệu. GET analytics không tự gọi LLM trong queryFn.

Tất cả projection PersonRef/EntityLabel là chỉ đọc; mapper create/update giữ whitelist cũ và không spread response vào body. Reviewer/assignee nullable phải đồng bộ field ID gốc. Link action dùng enum/ID đã validate; không tin URL do model trả.

Provider output sai là trách nhiệm BE chặn trước khi lưu; FE nhận typed job error OUTPUT_INVALID. Nếu API vẫn trả DTO sai hoặc mismatch snapshot, FE báo ContractError và không ghi cache. Những kiểm tra cấu trúc này không thay đối chiếu ngữ nghĩa/số liệu ở BE.


## Ranh giới thêm ở 0.4

createAnalysisFeedback: Zod params analysisId, query rỗng, strict body verdict CONFIRMED/REJECTED và comment trim 1–2000; response kiểm tra analysisId/snapshotId/actor.id=actorId. Không gửi actorId hoặc snapshotId trong body. canSubmit/snapshot CURRENT chỉ là điều kiện UI, BE kiểm tra lại.

listAnalyticsFilterOptions: strict kind/q/filter cha/page/pageSize; Page<EntityLabel> có id/name tối thiểu. Với PERSON, name là displayName, không đòi UserDTO. summaryText/systemSummary là chuỗi template BE; projects[] và nhãn/giờ projectComparisons được kiểm tra như các field response bắt buộc. TeamId phải nằm trong normalizedQuery và scope snapshot.
