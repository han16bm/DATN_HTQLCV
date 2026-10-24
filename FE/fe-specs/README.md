# Bộ đặc tả frontend để giao Codex triển khai

Tài liệu **0.4** · Contract đề xuất **0.3.0** · 24/10/2026.

Đã đối chiếu 27 Use Case của báo cáo nguồn 70 trang. Bảng chức năng và các điểm đã bổ sung ở [FUNCTION_COVERAGE.md](FUNCTION_COVERAGE.md). Đây là ảnh thiết kế và tài liệu cho bước code sau.

## Thành phần bàn giao

| Thành phần | Nội dung |
|---|---|
| Ảnh | 24 màn chính, giữ font, chữ nhẹ, ít icon và góc nhỏ; [MAIN_SCREENS.md](screens/MAIN_SCREENS.md) |
| Đặc tả màn | Đủ 43 mã màn/biểu mẫu/hộp thoại; [SCREEN_SPECIFICATIONS.md](screens/SCREEN_SPECIFICATIONS.md) |
| Sitemap | [SITE_MAP.txt](screens/SITE_MAP.txt), gồm menu/quyền/route/điều hướng |
| State | [UI_STATES.txt](screens/UI_STATES.txt), [BUSINESS_STATES.txt](screens/BUSINESS_STATES.txt), [ANALYSIS_FLOW.txt](screens/ANALYSIS_FLOW.txt) |
| Mock | [MOCK_MODELS.txt](mock/MOCK_MODELS.txt): model, fixture, scenario, snapshot/LLM/feedback/template và delivery sau commit |
| API/DTO | 79 operation, 93 schema gốc; [API_CATALOG.md](api/API_CATALOG.md), [DTO_MODELS.md](api/DTO_MODELS.md) |
| Zod / React Query | [ZOD_REACT_QUERY_MATRIX.md](api/ZOD_REACT_QUERY_MATRIX.md) và [ZOD_AND_FIELD_MAPPING.md](rules/ZOD_AND_FIELD_MAPPING.md) |
| Quy tắc triển khai | [AGENTS.md](AGENTS.md), [FEATURE_BASED_STRUCTURE.md](rules/FEATURE_BASED_STRUCTURE.md), [DESIGN_SYSTEM.md](rules/DESIGN_SYSTEM.md) |
| AI | [LLM_ANALYSIS.md](rules/LLM_ANALYSIS.md), [API_CHANGELOG_LLM.md](api/API_CHANGELOG_LLM.md) |
| Đối chiếu nguồn | [FUNCTION_COVERAGE.md](FUNCTION_COVERAGE.md), [SOURCE_QUALITY_AND_SCENARIOS.txt](rules/SOURCE_QUALITY_AND_SCENARIOS.txt) |

## Cách dùng

Codex đọc AGENTS.md, bảng đối chiếu nguồn và DESIGN_SYSTEM trước. Dùng PNG cho màn chính, đặc tả field/action cho màn phụ, TXT cho điều hướng/state. Tuân thủ whitelist, DTO/Zod, React Query, MSW và nghiệp vụ; 24 PNG không giới hạn số luồng cần triển khai.

S43 hiển thị thông số/căn cứ và lời AI của cùng snapshot. Tổng hợp theo mẫu vẫn có khi LLM lỗi. Xác nhận/bác bỏ điểm nghẽn lưu phản hồi riêng; đề xuất AI chỉ mở nghiệp vụ cho người có quyền quyết định.

BE dùng Microservices qua public Gateway; FE không biết URL service nội bộ hoặc chứa key/provider SDK LLM. API là contract đề xuất để đối chiếu BE thật. Phạm vi giữ đủ nghiệp vụ nguồn, bỏ thiết kế dữ liệu tổng thể/ERD theo yêu cầu.
