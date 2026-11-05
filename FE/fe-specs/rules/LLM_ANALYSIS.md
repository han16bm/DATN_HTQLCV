# Phân tích bằng LLM có sẵn: luồng dữ liệu và quy tắc triển khai

Contract đề xuất 0.3.0 · cập nhật 24/10/2026. Dùng LLM do BE cấu hình qua API/endpoint có sẵn. Không đặt yêu cầu huấn luyện một mô hình dự báo riêng. Provider hỗ trợ: Anthropic Claude và Google Gemini; mặc định là Anthropic nếu không đặt `Analytics:Provider`.

## Trạng thái triển khai

Cập nhật 05/11/2026: MVP dùng adapter có thể chọn Anthropic Claude hoặc Google Gemini qua `Analytics.Api`. Job được lưu ở `AnalysisJobs`, chạy nền và có thể poll; đầu ra được kiểm tra schema và mọi metric/evidence citation phải tồn tại trong snapshot. FE chỉ hiển thị lời giải thích đã qua kiểm tra. Không có API key trong source code.

Sau khi áp migration `AddAnthropicLlmConfigs`, cấu hình tại **Admin → Cấu hình tập trung → Analytics.Api → AI**:

- `Analytics:Anthropic:ApiKey`: nhập khóa trong cấu hình secret (BE mã hóa khi lưu, không trả giá trị lại).
- `Analytics:Anthropic:Model`: model ID được tài khoản Anthropic cấp quyền; mặc định `claude-sonnet-4-5-20250929`.

Secret được giải mã bằng `CentralConfig:SecretKey` hoặc `Jwt:SigningKey` theo `ConfigSecretBox`; phải giữ nguyên khóa mã hóa giữa các lần chạy. Nếu chưa cấu hình key, giao diện giữ nguyên số liệu và báo trạng thái LLM chưa khả dụng. Chưa thực hiện kiểm thử gọi provider thật; các kiểm thử hiện dùng HTTP handler giả.

### Dùng Gemini tạm thời để test local

Adapter gọi [Gemini API qua OpenAI compatibility endpoint](https://ai.google.dev/gemini-api/docs/openai). Lấy API key từ [Google AI Studio](https://aistudio.google.com/apikey), rồi chạy tại thư mục gốc repo. User Secrets được ưu tiên cao hơn `SystemConfigs`, nên không cần thêm migration hay lưu key vào DB:

```powershell
dotnet user-secrets set "Analytics:Provider" "Gemini" --project BE\Services\Analytics.Api\Analytics.Api.csproj
dotnet user-secrets set "Analytics:Gemini:ApiKey" "<API_KEY>" --project BE\Services\Analytics.Api\Analytics.Api.csproj
dotnet user-secrets set "Analytics:Gemini:Model" "gemini-3.8-flash" --project BE\Services\Analytics.Api\Analytics.Api.csproj
```

Khởi động lại `Analytics.Api` để nạp User Secrets. Khi chạy thử qua FE, khởi động cả Gateway và các service/DB như luồng BE bình thường, rồi yêu cầu sinh hoặc tạo lại lời giải thích phân tích. Model phải được bật cho API key của bạn. Không dùng `user-secrets list` khi chia sẻ màn hình/log vì lệnh đó hiển thị giá trị secret.

Để quay về Claude, đặt `Analytics:Provider` thành `Anthropic` và cấu hình `Analytics:Anthropic:ApiKey`; hoặc xóa selector local bằng:

```powershell
dotnet user-secrets remove "Analytics:Provider" --project BE\Services\Analytics.Api\Analytics.Api.csproj
```

Sau đó khởi động lại Analytics.Api. Chỉ gửi dữ liệu dự án đã được phép xử lý qua Google; evidence label có thể chứa tiêu đề công việc.

Khi sinh lời giải thích, BE gửi tới provider đang chọn loại phân tích, loại đối tượng, kỳ, chất lượng, metrics, context, chuỗi số liệu và nhãn evidence tối thiểu. Không gửi subject ID, snapshot/analysis ID, tên/tiêu đề dự án riêng, domain action ID, email, tài khoản, tệp đính kèm hoặc system summary. Nhãn evidence vẫn có thể chứa tiêu đề công việc; chỉ bật provider sau khi tổ chức chấp thuận việc xử lý dữ liệu đó với nhà cung cấp tương ứng.

## Trải nghiệm người dùng

Từ dashboard, hàng nguy cơ, nhân viên, điểm nghẽn, cảnh báo hoặc tổng hợp, bấm Xem chi tiết mở S43. Giữ phạm vi dự án/kỳ/bộ lọc từ AnalysisRef đã được BE cấp; URL dùng analysisId để chia sẻ đúng bản dữ liệu. S43 hiển thị cùng lúc thông số, bối cảnh và lời phân tích AI có căn cứ. Desktop chia vùng thông số/chứng cứ và vùng AI; mobile xếp lại, có nhãn điều hướng tới từng phần.

Mở chi tiết lấy thông số ngay. Nếu đã có lời phân tích hợp lệ thì hiện cùng lúc. Nếu chưa có và BE cho phép, thực hiện một REUSE_OR_CREATE rồi hiện “AI đang phân tích” tại phần AI. Số liệu và chứng cứ vẫn đọc được. Có lỗi hoặc chưa cấu hình LLM thì chỉ vùng AI báo tình trạng; không biến số liệu thành 0 và không khóa nghiệp vụ công việc.

## Phân chia trách nhiệm

| Thành phần | Trách nhiệm |
|---|---|
| FE | Hiển thị/định dạng dữ liệu, gọi Gateway, validate DTO, theo dõi job; giữ đúng snapshot khi ghép lời phân tích |
| Gateway | Xác thực/định tuyến public API đến service thích hợp theo cấu hình BE |
| BE nghiệp vụ | Nguồn task, lịch sử, giờ, lần nộp và báo cáo; kiểm tra quyền hiện tại |
| Service phân tích | Tập hợp nguồn được phép, tính KPI/quy tắc và tạo snapshot; quản lý job, cache và kết quả |
| Adapter LLM phía BE | Chọn model đang cấu hình, dựng đầu vào từ snapshot tối thiểu, gọi API, parse và kiểm tra output |
| LLM có sẵn | Diễn giải điểm đáng chú ý, căn cứ, giới hạn và đề xuất; không là nguồn tính số liệu, quyền hoặc lệnh sửa dữ liệu |

Mọi access key/provider URL riêng nằm ở BE. FE không gửi prompt tự do, model name, provider key, raw TaskDTO hay quyền tự khai báo trong createAnalysisJob.

## Luồng đọc và sinh lời phân tích

1. GET tổng quan tính/đọc read model và trả analysisRef cho mỗi đối tượng cần chi tiết. Có thể dùng cache read model để giữ snapshot ổn định; GET không tạo job hoặc gọi LLM.
2. Click ref → GET /analytics/details/:analysisId. BE kiểm tra quyền hiện tại, trả snapshot bất biến và trạng thái explanation/generation/freshness.
3. READY: render lastSuccess. QUEUED/RUNNING: theo dõi activeJobId. NOT_REQUESTED + allowed: một mutation createAnalysisJob với analysisId, generationMode=REUSE_OR_CREATE, locale=vi-VN và Idempotency-Key.
4. BE kiểm tra snapshot còn hiệu lực/đúng quyền, gom lượt yêu cầu trùng, cố định snapshotId, promptVersion, model configuration và locale vào job.
5. Adapter tạo đầu vào từ metrics, context và evidence đã lọc. Nếu nhà cung cấp/model hỗ trợ structured output/JSON schema, dùng khả năng đó; luôn kiểm tra lại phía BE. Nếu chỉ trả text JSON, parse/validate có giới hạn; lỗi không trở thành READY.
6. LLM trả summary/findings/recommendations/limitations có metricIds/evidenceIds. BE kiểm tra schema, giới hạn độ dài, citation và map action từ evidence có sẵn; từ chối câu chữ chứa chữ số để không biến số do model tự tạo thành kết luận. Nhận định định tính vẫn cần người quản lý đối chiếu; lỗi output đánh FAILED/OUTPUT_INVALID.
7. FE poll getAnalysisJob theo pollAfterMs; terminal refetch getAnalysisDetail của đúng analysisId. Không gắn nội dung của snapshot cũ vào số liệu mới.
8. Phân tích lại là hành động rõ ràng dùng REGENERATE và khóa mới; không tự chạy do refocus, render lại, đổi tab hoặc refetch. Cùng snapshot/job đang chạy được reuse hoặc trả 409 kèm activeJobId.

## Thông số và lời diễn giải

Thông số đến từ task/time-log/submission/report, được BE tính theo công thức trong METRICS_K01_K16.md. LLM không tự tạo số phần trăm trễ, confidence hoặc score. Phân loại riskLevel xuất phát từ rule nghiệp vụ có ruleIds và assessmentBasis=BUSINESS_RULES. Một nhận định thận trọng của LLM không được biến thành trường số có vẻ chính xác.

Trên S43, metric có nhãn/giá trị/đơn vị/công thức/nguồn. Finding nêu nhận định và tham chiếu metricIds/evidenceIds. FE làm nổi chỉ số, có nút Xem căn cứ dẫn tới nguồn được phép. Recommendation chỉ mở màn nghiệp vụ tương ứng; người dùng vẫn quyết định và hệ thống vẫn kiểm tra quyền/thao tác như cũ.

JSON hợp lệ không bảo đảm nhận định đúng. Cần đối chiếu claim định lượng với dữ liệu nguồn, chặn citation không tồn tại và kiểm tra mẫu đầu ra. Những kết luận nhân quả hoặc đánh giá năng lực không có chứng cứ phải bị loại hoặc diễn đạt là điều chưa đủ căn cứ. Không hiển thị văn bản fallback do template hệ thống viết dưới nhãn “AI đã phân tích”.

## Snapshot, độ mới và kết quả cũ

- Snapshot gồm scope/subject/sourceRevision/dataAsOf/metrics/evidence; không sửa sau khi cấp ID.
- Read model giữ ID ổn định trong một phiên bản nguồn và khoảng freshness do BE quy định. Không coi mỗi giây đồng hồ trôi qua là nguồn thay đổi bắt buộc tạo job mới.
- Nguồn nghiệp vụ đổi: bản cũ vẫn có thể được đọc với freshness=OUTDATED và latestAnalysisId; nút Xem dữ liệu mới mở ID mới. Không đổi các số trong snapshot cũ.
- Một lời phân tích có generatedAt sau dataAsOf là bình thường; cả hai thời điểm được thể hiện rõ. Dữ liệu thiếu/null được giữ trong metrics và limitations.
- Tạo lại lời phân tích bị lỗi có thể giữ lastSuccess của cùng snapshot; UI báo lượt tạo lại lỗi và ghi thời điểm nội dung đang xem.
- Snapshot hết thời gian lưu trả 410 SNAPSHOT_EXPIRED; FE quay lại nguồn tổng quan để lấy ref mới, không đoán lại ID.
- Cache BE theo scope quyền/nguồn/subject/snapshot/prompt/model/locale; mỗi request vẫn kiểm tra quyền hiện tại. Không chỉ dựa vào người đã từng có quyền lúc snapshot được tạo.

## Trạng thái, thời hạn và retry

READY/FAILED/UNAVAILABLE/NOT_REQUESTED của lời phân tích khác với QUEUED/RUNNING/SUCCEEDED/FAILED của job và khác freshness CURRENT/OUTDATED. Không gộp các enum này.

Thời gian chờ provider và giới hạn retry được BE cấu hình. Đề xuất giai đoạn đầu: timeout 60 giây cho một lượt provider, tối đa một lượt sửa output có kiểm soát nếu chính sách cho phép; lỗi cấu hình/không đủ dữ liệu không retry. FE theo dõi tối đa 2 phút trong một lượt rồi cho Tiếp tục kiểm tra; không tự gán job FAILED.

Error DTO có code/message/retryable/retryAfterSeconds, không lộ provider stack/key/raw prompt. Mã lỗi gồm LLM_NOT_CONFIGURED, PROVIDER_TIMEOUT, PROVIDER_RATE_LIMIT, PROVIDER_UNAVAILABLE, OUTPUT_INVALID, REFUSED và INSUFFICIENT_DATA theo AnalysisErrorDTO. Giao diện thể hiện ngắn gọn nguyên nhân và hành động hợp lệ; số liệu luôn giữ nếu đã đọc thành công.

## Đầu vào LLM và dữ liệu không đáng tin

Chỉ gửi dữ liệu tối thiểu đã lọc quyền; ưu tiên số liệu và chứng cứ có ID. Không đưa mật khẩu/token/email cá nhân không cần thiết, tệp đính kèm thô hoặc toàn bộ lịch sử ngoài phạm vi vào prompt. Nội dung mô tả công việc là dữ liệu, không phải chỉ dẫn được phép thay prompt. LLM không được cấp công cụ ghi vào task, đổi người nhận hay duyệt kết quả. FE map DomainAction enum sang route hợp lệ, không chạy HTML/URL/lệnh trong văn bản LLM.

## Điều kiện nghiệm thu chức năng LLM

- Cùng snapshot và scope cho metrics, narrative và citations; mất quyền không đọc lại được kết quả cũ.
- Mở danh sách/dashboard không phát sinh LLM call; mở chi tiết mới reuse/create một lần; StrictMode/refocus không nhân đôi.
- LLM chậm/lỗi không chặn task, time log, review hoặc report.
- Thiếu capacity hoặc remaining không bị kết luận quá tải; đã nộp đúng hạn không bị diễn giải thành nộp muộn vì chờ reviewer.
- Output sai schema/citation/claim không được lưu thành READY; lỗi FE DTO khác lỗi output provider được BE chặn.
- Snapshot cũ và kết quả đến muộn không bị ghép vào phạm vi mới; regenerate lỗi vẫn giữ bản tốt đúng snapshot.

## Nguồn kỹ thuật

- [OpenAI: Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs): tham khảo cách một nhà cung cấp hỗ trợ đầu ra có cấu trúc; không phải quyết định chọn nhà cung cấp cho dự án.
- [OWASP: Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/): xử lý nội dung nguồn như dữ liệu không đáng tin.

Các lựa chọn endpoint, DTO, timeout đề xuất, cache và trải nghiệm ở đây là thiết kế cho dự án; BE cần đối chiếu API thực trước tích hợp.

## HTTP và lỗi sau khi nhận job

POST createAnalysisJob trả 200 khi reuse job đã SUCCEEDED, 202 cho job QUEUED/RUNNING. Idempotency replay giữ nguyên receipt ban đầu; FE đọc job mới nhất thay vì giả rằng receipt là trạng thái cuối. Lỗi provider phát sinh sau khi BE đã nhận job được phản ánh qua getAnalysisJob HTTP 200 với status FAILED/error typed; lỗi cấu hình hoặc không nhận được job có thể trả HTTP 503 ErrorDTO phẳng ngay. Cả hai trường hợp đều giữ số liệu đã đọc.


## Bổ sung sau đối chiếu tài liệu gốc 0.4

getAnalysisSummary.summaryText và getAnalysisDetail.systemSummary là tổng hợp theo mẫu, luôn có khi nguồn hợp lệ. Nhãn “Tổng hợp theo số liệu”, không gắn nhãn AI. Nội dung này giữ sẵn khi LLM lỗi/chưa chạy, đáp ứng UC-D06 trang 45; AI chỉ bổ sung diễn giải đã kiểm tra.

UC-D04 trang 43 bước 6: S43 BOTTLENECK cho xác nhận/bác bỏ nhận định khi feedback.canSubmit. createAnalysisFeedback chỉ gửi verdict/comment, có Idempotency-Key, giữ lịch sử và không đổi task/cảnh báo/riskLevel. Đây là phản hồi nhận định, tách biệt nghiệm thu kết quả.

getDeadlineRisks.projects tổng hợp nguy cơ dự án từ bằng chứng và quy tắc. Ref RISK có thể là TASK hoặc PROJECT. Mức dự án không là tỷ lệ cảnh báo hoặc xác suất tự LLM tính.

Rule scheduler và cảnh báo/notification chạy độc lập với GET và với job LLM. Mở detail chỉ yêu cầu lời diễn giải khi cần; không thay thế lịch đánh giá nguồn của UC-D02/D04.

Các lookup bộ lọc dùng listAnalyticsFilterOptions theo scope của ANALYTICS_VIEW; không gọi API quản trị để lấy nhãn. teamId thuộc normalizedQuery và snapshot scope, không vượt quyền dự án.

Tổng hợp nhiều dự án trong một đơn vị dùng SUMMARY subject UNIT, có scope nguồn rõ; không dùng lời/ref của một dự án làm tổng hợp toàn đơn vị.
