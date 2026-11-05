# Đặc tả nghiệp vụ frontend

Giữ API/DTO, whitelist, state machine, validation, snapshot và quy tắc tính số liệu của hệ thống. Tài liệu thiết kế màn cũ đã xóa; không dùng ảnh/mô tả trình bày cũ làm ràng buộc cho redesign.

- [Kiến trúc](../docs/ARCHITECTURE.md), [thiết kế hiện tại](../docs/DESIGN.md), [hướng dẫn triển khai](../AGENTS.md).
- [API catalog](api/API_CATALOG.md), [DTO](api/DTO_MODELS.md), [ma trận Zod/React Query](api/ZOD_REACT_QUERY_MATRIX.md).
- [Đối chiếu chức năng](FUNCTION_COVERAGE.md), state/sitemap trong screens/*.txt.
- Mock model/policy/scenario ở mock/MOCK_MODELS.txt; dữ liệu chạy thực tế trong src/mocks/data.json.
- Quy tắc validation, MSW, KPI, AI và nghiệm thu trong rules/; schema trong src/features là hợp đồng thực thi hiện hành.

FE chỉ gọi public Gateway qua HTTP. MSW thay backend ở ranh giới HTTP; thiết kế lại không tạo thêm API, dữ liệu giả hoặc quyền để phục vụ bố cục.
