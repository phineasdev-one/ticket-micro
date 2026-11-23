# Ticket Micro — dự án học NestJS và Kafka

> Đây là dự án thực hành kiến trúc microservices cho một hệ thống quản lý sự kiện và vé. Mục tiêu chính hiện tại là hiểu cách các service giao tiếp đồng bộ qua HTTP và bất đồng bộ qua Kafka, không phải xây dựng một hệ thống production hoàn chỉnh.

## Mục lục

- [1. Mục tiêu và trạng thái hiện tại](#1-mục-tiêu-và-trạng-thái-hiện-tại)
- [2. Kiến trúc](#2-kiến-trúc)
- [3. Vì sao hiện tại chỉ dùng một database?](#3-vì-sao-hiện-tại-chỉ-dùng-một-database)
- [4. Công nghệ](#4-công-nghệ)
- [5. Yêu cầu trước khi chạy](#5-yêu-cầu-trước-khi-chạy)
- [6. Cài đặt lần đầu](#6-cài-đặt-lần-đầu)
- [7. Cấu hình .env](#7-cấu-hình-env)
- [8. Chạy hạ tầng bằng Docker Compose](#8-chạy-hạ-tầng-bằng-docker-compose)
- [9. Đồng bộ schema database](#9-đồng-bộ-schema-database)
- [10. Chạy các ứng dụng NestJS](#10-chạy-các-ứng-dụng-nestjs)
- [11. API hiện có](#11-api-hiện-có)
- [12. Kafka trong dự án](#12-kafka-trong-dự-án)
- [13. Kiểm tra và test](#13-kiểm-tra-và-test)
- [14. Khắc phục lỗi thường gặp](#14-khắc-phục-lỗi-thường-gặp)
- [15. Hướng phát triển sau này](#15-hướng-phát-triển-sau-này)

## 1. Mục tiêu và trạng thái hiện tại

Dự án hiện có ba ứng dụng NestJS:

| Ứng dụng | Port | Vai trò |
|---|---:|---|
| API Gateway | 3000 | Điểm HTTP đầu vào; chuyển tiếp yêu cầu tới Auth Service hoặc Events Service. |
| Auth Service | 3001 | Đăng ký, đăng nhập, xác thực JWT và trả thông tin hồ sơ. |
| Events Service | 3003 | Tạo, đọc, cập nhật, xuất bản và hủy sự kiện. Gửi một số event lên Kafka. |

Cơ sở dữ liệu là PostgreSQL, dùng chung bởi Auth Service và Events Service. Kafka và các công cụ phụ trợ chạy bằng Docker Compose; các ứng dụng NestJS được chạy riêng trên máy host trong hướng dẫn này.

**Đã có:** các HTTP endpoint của Gateway/Auth/Events; schema PostgreSQL cho `users`, `events`, `tickets`; Kafka client được cấu hình và Events Service phát một số event khi tạo, cập nhật hoặc hủy sự kiện.

**Chưa hoàn thiện:** Ticket Service và Notification Service chưa được cài đặt. Bảng `tickets` trong schema không có nghĩa là đã có API xử lý vé. Một số Kafka topic đã được khai báo nhưng consumer/handler xử lý các topic đó chưa được triển khai. Đăng ký người dùng hiện cũng chưa gọi luồng phát `USER_REGISTERED` trong endpoint đăng ký.

## 2. Kiến trúc

Sơ đồ kiến trúc có thể mở và chỉnh sửa bằng draw.io: [docs/architecture.drawio](docs/architecture.drawio). Sơ đồ phân biệt các thành phần đang chạy với các service dự kiến trong tương lai.

Luồng HTTP hiện tại:

1. Client gọi API Gateway tại `http://localhost:3000`.
2. Gateway chuyển tiếp yêu cầu xác thực tới Auth Service (`localhost:3001`) hoặc yêu cầu sự kiện tới Events Service (`localhost:3003`).
3. Auth Service và Events Service dùng chung PostgreSQL qua thư viện `libs/database` và Drizzle ORM.
4. Events Service kết nối Kafka và phát các event như `event.created`, `event.updated`, `event.cancelled`.
5. Kafka UI dùng để quan sát cluster tại `http://localhost:8080`.

Các URL giữa Gateway và service đang được ghi trực tiếp là `localhost`; đây là cấu hình chạy local, chưa phải cấu hình triển khai các container ứng dụng lên mạng Docker.

## 3. Vì sao hiện tại chỉ dùng một database?

Đây là lựa chọn có chủ đích để **giảm số lượng khái niệm cần học cùng lúc**. Mục tiêu trước mắt là thực hành Kafka: producer phát message, topic, consumer group, consumer xử lý bất đồng bộ và cách các service phối hợp. Nếu cùng lúc tạo một PostgreSQL riêng cho từng service, người học còn phải cấu hình nhiều database, nhiều connection string, migration riêng, khởi tạo và sao lưu từng DB, cũng như xử lý các khác biệt khi chạy local/Docker.

Với một database, bạn vẫn thực hành được:

- Tách mã nguồn và trách nhiệm thành các NestJS service.
- Dùng HTTP qua Gateway cho các thao tác cần phản hồi ngay.
- Phát event qua Kafka để học giao tiếp bất đồng bộ.
- Quản lý schema bằng Drizzle Kit.

Đổi lại, đây **không phải ranh giới dữ liệu độc lập hoàn toàn** theo cách một kiến trúc microservices hướng production thường cố gắng đạt được. Hiện tại các bảng nằm trong cùng PostgreSQL và các service dùng chung thư viện schema/database; điều này khiến việc tách, triển khai hoặc thay đổi dữ liệu độc lập về sau khó hơn. Khi đã hiểu rõ Kafka, có thể nâng cấp dần: giới hạn quyền truy cập theo service, tách schema hoặc database, rồi xử lý đồng bộ dữ liệu và tính nhất quán. Không cần làm tất cả ngay trong bài tập này.

## 4. Công nghệ

- Node.js `22.22.3` (phiên bản ghi trong `.nvmrc`).
- pnpm, NestJS, TypeScript.
- PostgreSQL 16, Drizzle ORM và Drizzle Kit.
- KafkaJS / NestJS Kafka transport, Kafka và ZooKeeper.
- Docker Compose; Redis và MailHog được khai báo trong Compose để tiện thực hành sau này.

Redis và MailHog hiện chỉ là hạ tầng có thể khởi động; code hiện tại chưa tích hợp chúng vào luồng ứng dụng.

## 5. Yêu cầu trước khi chạy

Cài đặt các công cụ sau:

1. Git.
2. Node.js `22.22.3` và nvm (khuyến nghị, vì dự án có `.nvmrc`).
3. Corepack/pnpm tương thích với package manager của dự án.
4. Docker Desktop (hoặc Docker Engine có Docker Compose).

Kiểm tra phiên bản sau khi mở terminal tại thư mục dự án:

```bash
nvm use
node --version
pnpm --version
```

`node --version` cần trả về `v22.22.3`. Nếu máy chưa bật Corepack, có thể chạy `corepack enable` rồi kiểm tra lại pnpm. Không cần cài Kafka hoặc PostgreSQL riêng nếu dùng các container trong Compose.

## 6. Cài đặt lần đầu

Chạy tại thư mục gốc repository:

```bash
pnpm install
```

Nếu pnpm báo một package bị chặn bởi chính sách minimum release age, đó là chính sách cài dependency của workspace, không nhất thiết là lỗi trong source. Không nên tắt chính sách này toàn cục; xử lý theo thông báo cụ thể và cấu hình hiện có của repository.

## 7. Cấu hình .env

Tạo file `.env` tại thư mục gốc (cùng cấp `package.json`) nếu chưa có. Không commit file này và không chia sẻ giá trị secret. Ví dụ cho môi trường local dùng đúng các cổng/giá trị database trong `docker-compose.yaml`:

```dotenv
DATABASE_URL=postgresql://ticket:ticket_password@localhost:5432/ticket
JWT_SECRET=thay-bang-mot-chuoi-bi-mat-dai-va-ngau-nhien
KAFKA_BROKER=localhost:9093
KAFKA_CLIENT_ID=ticket-micro-client
```

Giải thích:

- `DATABASE_URL`: chuỗi kết nối PostgreSQL từ máy host. User/password/database phải khớp với cấu hình Compose.
- `JWT_SECRET`: khóa ký JWT. Giá trị mặc định trong source chỉ phục vụ cấu hình dự phòng/dev; hãy tự đặt secret riêng, không dùng ví dụ này cho production.
- `KAFKA_BROKER`: khi NestJS chạy trực tiếp trên máy host, dùng `localhost:9093`.
- `KAFKA_CLIENT_ID`: ID client Kafka; có thể giữ mặc định cho local.
- `OBSERVE_APP_KEY` và `OBSERVE_APP_SECRET`: tùy chọn nếu muốn liên kết NestJS Observe. Không cần để chạy luồng cốt lõi. Có thể liên kết bằng `npx @nestjs/observe link`; lệnh này sẽ yêu cầu xác nhận trên trình duyệt và tự ghi cặp khóa vào `.env`.

Khi Nest CLI hỏi có source file `.env` hay không, chọn **Yes**. Nếu ứng dụng báo thiếu `DATABASE_URL` hoặc kết nối DB dùng giá trị không đúng, hãy dừng các tiến trình Nest đang chạy, xác nhận `.env` ở đúng thư mục gốc, rồi chạy lại và chấp nhận nạp dotenv. Tuyệt đối không dán secret thật vào issue hoặc log công khai.

> Nếu chạy ứng dụng NestJS bên trong Docker sau này, `localhost` bên trong container không trỏ tới container PostgreSQL/Kafka. Khi đó cần cấu hình hostname dịch vụ Compose (ví dụ `postgres:5432`, `kafka:29092`) và chuyển các app URL sang địa chỉ nội bộ phù hợp. Hướng dẫn hiện tại chạy app trên host nên dùng các địa chỉ `localhost` ở trên.

## 8. Chạy hạ tầng bằng Docker Compose

Khởi động PostgreSQL, Kafka, ZooKeeper và các công cụ phụ trợ:

```bash
docker compose up -d
```

Kiểm tra container:

```bash
docker compose ps
```

Các địa chỉ local:

| Thành phần | Địa chỉ từ máy host | Ghi chú |
|---|---|---|
| PostgreSQL | `localhost:5432` | DB `ticket`; giá trị khởi tạo nằm trong Compose. |
| Kafka | `localhost:9093` | Bootstrap server cho ứng dụng chạy trên host. |
| Kafka trong mạng Compose | `kafka:29092` | Dùng từ container cùng mạng Compose, không dùng cho app chạy trực tiếp trên host. |
| Kafka UI | `http://localhost:8080` | Xem cluster, topic và consumer group. |
| ZooKeeper | `localhost:2181` | Kafka Compose hiện tại dùng ZooKeeper. |
| Redis | `localhost:6379` | Hạ tầng phụ trợ; app chưa dùng. |
| MailHog SMTP | `localhost:1025` | Hạ tầng email thử nghiệm; app chưa gửi mail. |
| MailHog UI | `http://localhost:8025` | Giao diện xem email thử nghiệm. |

Compose **không khởi động** API Gateway/Auth/Events. Hãy giữ Docker Compose chạy, sau đó mở terminal riêng cho từng NestJS app. Khi muốn dừng hạ tầng:

```bash
docker compose down
```

Lệnh trên giữ lại dữ liệu trong named volumes. Muốn xóa cả dữ liệu PostgreSQL/Kafka/ZooKeeper/Redis local để bắt đầu lại, cần chủ động dùng `docker compose down -v`; thao tác này xóa dữ liệu trong các volume, hãy kiểm tra kỹ trước khi chạy.

## 9. Đồng bộ schema database

Sau khi PostgreSQL đã chạy và `.env` có `DATABASE_URL`, chạy lệnh sau từ thư mục gốc:

```bash
npx drizzle-kit push
```

Drizzle Kit đọc cấu hình tại `drizzle.config.ts`, lấy schema từ `libs/database/src/schema` và đồng bộ trực tiếp cấu trúc database dev. Schema hiện định nghĩa các bảng `users`, `events`, `tickets` cùng enum và quan hệ liên quan.

`push` tiện cho học tập và phát triển local, nhưng không đồng nghĩa với quy trình migration versioned phù hợp production. Đọc kỹ thay đổi Drizzle Kit đề xuất trước khi xác nhận; không chạy trên database có dữ liệu quan trọng nếu chưa có backup và chưa hiểu tác động. Nếu lệnh báo thiếu `DATABASE_URL`, kiểm tra `.env`, thư mục hiện tại và giá trị kết nối PostgreSQL.

## 10. Chạy các ứng dụng NestJS

Mở **ba terminal riêng**, đều ở thư mục gốc dự án. Trước khi chạy app, hãy chắc chắn Compose đang hoạt động và database đã được đồng bộ schema. Nếu CLI hỏi có nạp `.env`, chọn Yes.

Terminal 1 — API Gateway:

```bash
pnpm exec nest start api-gateway --watch
```

Terminal 2 — Auth Service:

```bash
pnpm exec nest start auth-service --watch
```

Terminal 3 — Events Service:

```bash
pnpm exec nest start events-service --watch
```

Khi khởi động thành công, các cổng lần lượt là `3000`, `3001`, `3003`. Client chỉ cần gọi Gateway ở `http://localhost:3000`; Gateway tự chuyển tiếp request nội bộ tới các service. Không chạy nhiều bản sao Auth Service cùng lúc trong lúc mới học Kafka, vì cùng consumer group có thể gây rebalance và làm log khó theo dõi.

Build các ứng dụng:

```bash
pnpm build
```

> Lưu ý: script `start:dev` chung trong `package.json` không chọn project cụ thể. Dùng các lệnh `nest start <tên-project> --watch` ở trên để chắc chắn khởi chạy đúng app.

## 11. API hiện có

Các route bên dưới được gọi qua Gateway tại `http://localhost:3000`.

### Auth

| Method | Đường dẫn | Mô tả |
|---|---|---|
| `POST` | `/auth/register` | Tạo tài khoản. |
| `POST` | `/auth/login` | Đăng nhập và nhận JWT theo response hiện tại của service. |
| `GET` | `/auth/profile` | Lấy profile; gửi JWT trong header `Authorization: Bearer <token>`. |

### Events

| Method | Đường dẫn | Mô tả |
|---|---|---|
| `GET` | `/events` | Danh sách sự kiện đã xuất bản. |
| `GET` | `/events/:id` | Chi tiết sự kiện. |
| `GET` | `/events/my-events` | Sự kiện của người dùng đang đăng nhập; cần JWT. |
| `POST` | `/events` | Tạo sự kiện; cần JWT. |
| `PUT` | `/events/:id` | Cập nhật; cần JWT và quyền phù hợp. |
| `POST` | `/events/:id/publish` | Xuất bản; cần JWT và quyền phù hợp. |
| `POST` | `/events/:id/cancel` | Hủy; cần JWT và quyền phù hợp. |

Các request tạo/cập nhật cần body theo DTO trong `libs/common/src/dto`. Với các route được bảo vệ, gửi header `Authorization: Bearer <JWT>`. Gateway chuyển thông tin định danh người dùng sang Events Service qua các header nội bộ `x-user-id` và `x-user-role`.

Ví dụ đăng ký (thay email/password bằng giá trị thử nghiệm của bạn):

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"learner@example.com","password":"your-test-password","name":"Learner"}'
```

Response của một số endpoint có thể chưa khớp hoàn toàn với interface dùng ở Gateway; nếu client của bạn gặp khác biệt, hãy kiểm tra response thực tế của Auth Service và kiểu trong `libs/common`.

## 12. Kafka trong dự án

Kafka broker trong Compose có hai địa chỉ advertised:

- Ứng dụng NestJS chạy trên host: `localhost:9093`.
- Ứng dụng/container trong mạng Compose: `kafka:29092`.

Không đổi lẫn hai địa chỉ này: Kafka trả địa chỉ broker advertised cho client, nên dùng sai listener có thể khiến kết nối ban đầu thành công nhưng các lần kết nối tiếp theo thất bại.

Events Service đang phát các topic `event.created`, `event.updated` và `event.cancelled`. Danh sách topic cho user/ticket/payment/notification cũng được khai báo trong thư viện Kafka, nhưng việc khai báo tên topic **không có nghĩa** đã tồn tại service tiêu thụ topic. Hiện chưa có `@EventPattern`/Kafka message handler trong các app; consumer và các workflow notification/ticket là phần học tiếp theo.

Mở Kafka UI tại `http://localhost:8080` để quan sát cluster. Topic có thể chỉ xuất hiện sau khi broker nhận message đầu tiên, tùy cấu hình Kafka/UI.

## 13. Kiểm tra và test

Các lệnh test hiện có trong `package.json`:

```bash
pnpm test
pnpm test:e2e
pnpm test:cov
```

Build hiện tại đã được kiểm tra thành công trong môi trường phát triển. Tuy nhiên, test có thể còn expectation cũ hoặc chưa phản ánh đầy đủ các response/luồng tích hợp hiện tại; không xem việc build thành công là xác nhận toàn bộ nghiệp vụ đã hoàn chỉnh. Khi sửa một service, nên chạy test tập trung của service đó và kiểm tra lại luồng qua Gateway.

## 14. Khắc phục lỗi thường gặp

### Không kết nối được PostgreSQL

- Chạy `docker compose ps` và xác nhận `ticket-postgres` đang hoạt động.
- Xác nhận port `5432` trên máy không bị một PostgreSQL khác chiếm.
- Khi app chạy trên host, `DATABASE_URL` phải dùng `localhost:5432`, không phải `postgres:5432`.
- Kiểm tra đã chọn Yes khi Nest CLI hỏi source `.env` chưa.

### Không kết nối được Kafka

- App chạy host dùng `KAFKA_BROKER=localhost:9093`.
- Kafka UI/container dùng địa chỉ nội bộ `kafka:29092`.
- Kiểm tra `ticket-kafka` đã healthy/running và thử mở Kafka UI.

### Bảng chưa tồn tại

Chạy `npx drizzle-kit push` từ thư mục gốc sau khi database đã khởi động và `.env` đã có kết nối đúng.

### Port đang được sử dụng

Dừng tiến trình app/container cũ đang giữ cổng `3000`, `3001`, `3003`, `5432`, `9093` hoặc đổi cấu hình port tương ứng. Không khởi động trùng nhiều app trong các terminal mà quên dừng tiến trình trước.

### `pnpm` hoặc Node không đúng phiên bản

Chạy `nvm use` tại thư mục dự án để chuyển về Node version trong `.nvmrc`, rồi kiểm tra lại `node --version` và `pnpm --version`.

## 15. Hướng phát triển sau này

Các phần dự định để học tiếp, chưa được xem là chức năng hiện có:

1. Xây dựng Ticket Service sử dụng bảng `tickets`.
2. Dùng Kafka consumer để xử lý quy trình mua vé và các event liên quan.
3. Xây dựng Notification Service nhận event và gửi email qua MailHog ở local.
4. Bổ sung kiểm thử tích hợp end-to-end giữa Gateway, service, PostgreSQL và Kafka.
5. Khi đã hiểu các luồng trên, cân nhắc tách ranh giới database của từng service và chuyển cấu hình sang môi trường triển khai phù hợp.

Redis, thanh toán và nhiều topic đã khai báo có thể là đề tài thực hành sau; chúng chưa được mô tả như tính năng đã hoàn thành.
