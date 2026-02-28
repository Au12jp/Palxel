# Palxel
> **Pal**ette + Pi**xel** — A real-time pixel display system for Minecraft Bedrock Edition

[English](#english) · [日本語](#日本語)

---

<a name="english"></a>

## Overview

Palxel encodes RGB into a single 24-bit entity property int and renders it in real time via `overlay_color` — no textures, no particles.

```
R × 65536 + G × 256 + B  →  au12jp:palxel_N
```

Each entity carries 32 independently colored bones (8 × 4).  
The more properties per entity, the fewer entities needed — server and client overhead approaches zero.

## Resolution

| | Resolution | Entities |
|---|---|---|
| Demo | 64 × 36 px | 72 |
| Theoretical | HD · 4K | 1 |

*16:9 aspect ratio throughout.*

## Usage

```sh
/scriptevent au12jp:palxel       # Open UI
/scriptevent au12jp:palxel_anim  # Toggle random animation
```

## Performance

| | |
|---|---|
| Per-tick cost | `setProperty` only — no `runJob` |
| Rendering | Fully client-side |
| Potential | 60fps+ via animation staggering |

## Roadmap

- [ ] Write entity NBT externally via addon / WebSocket (Node.js) — Minecraft handles structure calls only
- [ ] In-game editor for mobile small-team addon / RPG development
- [ ] Anti-theft protection for UI and forms

## Structure

```
Behaviour Pack
├── entities/palxel.json           # au12jp:palxel_0 ~ 31
└── scripts/palxel.js

Resource Pack
├── entity/palxel.entity.json
├── render_controllers/palxel.render_controllers.json
└── models/entity/palxel.geo.json  # 32 bones (8 × 4)
```

## References

- [Entity property limits — 24-bit int](https://qiita.com/glasses_seven/items/5553772d3fa8edd09cc0#%E5%90%84%E7%A8%AE%E5%88%B6%E9%99%90%E4%BA%8B%E9%A0%85)

---

<a name="日本語"></a>

## 概要

エンティティプロパティの int（24bit、0〜16,777,215）に RGB を詰め込み、レンダーコントローラーの `overlay_color` でリアルタイムに色を反映します。テクスチャもパーティクルも不要。

```
R × 65536 + G × 256 + B  →  au12jp:palxel_N
```

1エンティティに32ボーン（8 × 4）を持ち、各ボーンを独立した色で制御。  
プロパティ数を増やすほど必要エンティティ数が減り、負荷をほぼゼロにできます。

## 解像度

| | 解像度 | エンティティ数 |
|---|---|---|
| デモ | 64 × 36 px | 72体 |
| 理論値 | HD · 4K | 1体 |

*アスペクト比はいずれも 16:9。*

## 使い方

```sh
/scriptevent au12jp:palxel       # UI を開く
/scriptevent au12jp:palxel_anim  # ランダムアニメーションのトグル
```

## パフォーマンス

| | |
|---|---|
| tick 毎の処理 | `setProperty` のみ（`runJob` 不使用） |
| レンダリング | 完全にクライアント側 |
| 可能性 | アニメーションのずらしで 60fps 以上も |

## 今後の展望

- [ ] エンティティ NBT を外部（addon / WebSocket / Node.js）で書き込み、マイクラ側はストラクチャー呼び出しのみ
- [ ] モバイル・少人数での大規模アドオン・RPG 開発向けゲーム内エディター
- [ ] UI・フォームのアドオン盗難防止策として活用

## ファイル構成

```
Behaviour Pack
├── entities/palxel.json           # au12jp:palxel_0 ~ 31
└── scripts/palxel.js

Resource Pack
├── entity/palxel.entity.json
├── render_controllers/palxel.render_controllers.json
└── models/entity/palxel.geo.json  # 32ボーン（8 × 4）
```

## 参考

- [エンティティプロパティの制限（24bit int）](https://qiita.com/glasses_seven/items/5553772d3fa8edd09cc0#%E5%90%84%E7%A8%AE%E5%88%B6%E9%99%90%E4%BA%8B%E9%A0%85)
