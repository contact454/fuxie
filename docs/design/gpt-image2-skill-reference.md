# GPT-Image2-Skill — tham chiếu prompt-craft & cách cài (cho B)

Repo: `wuyoscar/gpt_image_2_skill` (MIT / CC BY 4.0). Đây là CLI + script + thư viện prompt cho OpenAI `gpt-image-2` — đúng engine Codex của anh dùng. **Bản đầy đủ phải cài nơi sinh ảnh (Codex)**, không phải Cowork (vì cần script + `OPENAI_API_KEY`).

## Cài trên Codex (chọn 1)

```
# A) Qua plugin marketplace (gọn nhất)
/plugin marketplace add wuyoscar/gpt_image_2_skill
/plugin install gpt-image@wuyoscar-skills

# B) Qua skill-installer của Codex
$skill-installer
Install this skill from GitHub:
https://github.com/wuyoscar/gpt_image_2_skill/tree/main/skills/gpt-image

# C) Thủ công
git clone https://github.com/wuyoscar/gpt_image_2_skill.git
cp -R gpt_image_2_skill/skills/gpt-image "${CODEX_HOME:-$HOME/.codex}/skills/"
# rồi restart Codex
```

## Vì sao hợp Fuxie (nhu cầu B — nhất quán asset)
- Đúng model `gpt-image-2`; bọc 2 endpoint chính thức: `/v1/images/generations` (text→ảnh) và `/v1/images/edits` (sửa theo ảnh tham chiếu + mask).
- Có **reference-image editing & multi-reference**: đưa 1 style frame đã duyệt làm ảnh tham chiếu (`-i`) để các asset sau **kế thừa phong cách** → chính là cơ chế ép đồng nhất ta cần.
- `--quality low|medium|high` làm "núm" ngân sách: `low` quét nhiều biến thể rẻ, `high` cho asset chốt.
- Thư viện prompt (`references/gallery.md`, `craft.md`, `openai-cookbook.md`) hệ thống hóa prompt-craft — gắn thẳng vào STYLE LOCK của plan.

## Map vào pipeline Fuxie
- **Style frame:** `gpt-image -p "[STYLE LOCK] world map..." --size portrait --quality high`
- **Nhân rộng đồng nhất:** lấy style frame làm tham chiếu → `gpt-image -p "[STYLE LOCK] market close-up" -i style-frame.png --size portrait` (ép kế thừa ánh sáng/màu/nét).
- **Mask inpaint:** sửa cục bộ 1 vùng giữ nguyên phần còn lại (`-i base.png -m mask.png`).
- **Kích thước:** mobile portrait `1024x1536`; mockup màn `portrait`; hero/dashboard `4k`.

## Flags hay dùng
`-p` prompt · `-f` file ra · `-i` ảnh tham chiếu (lặp được) · `-m` mask PNG · `--size` (portrait/landscape/1k/2k/4k...) · `--quality` · `-n` số ảnh · `--format png|jpeg|webp`.

> Lưu ý nội dung: endpoint edits từ chối chỉnh ảnh giống người thật (lỗi 400 moderation) — không ảnh hưởng asset game 2.5D.
