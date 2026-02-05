---
description: Rule for pull and push
---

1. Trước khi commit code. Nếu có thư mục docs / doccuments trong dự án. Hãy bổ sung những thay đổi tương ứng vào file tương ứng trước khi commit

2. Branch name is <yyyymmdd_hhmmss>_<chức năng>
 - Khi tôi nói bắt đầu chức năng mới <chức năng>, hãy tạo branch <yyyymmdd_hhmmss>_<chức năng> từ `main` theo tiêu chuẩn đặt tên

3.When push code: 
 - Nếu tôi muốn push code lên 1 branch, chỉ cần push là được.
 - Nếu tôi muốn `sync develop`, hãy push code lên branch hiện tại, merge vào develop, switch trở lại branch hiện tại.
 - Nếu tôi muốn push vào `develop`. hãy push lên branch hiện tại, merge vào develop, switch trở lại branch hiện tại.
 - Nếu tôi muốn `deploy` hãy `sync develop` sau đó sync vào `main` branch