//@ts-check
import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

const ENTITY_TYPE  = "au12jp:palxel";
const PALXEL_COUNT = 32; // 1エンティティあたりのボーン数（8×4）

// ── グリッド定義 ───────────────────────────────────────
// 解像度: 64×36px (16:9完全一致)
// 1エンティティ = 8列×4行 = 32px
// グリッド: 横8エンティティ × 縦9エンティティ = 72体
// ワールド上のサイズ: 横8ブロック × 縦4.5ブロック
//   (1エンティティ = 横1ブロック × 縦0.5ブロック)

const ENT_COLS       = 8;
const ENT_ROWS       = 9;
const TOTAL_ENTITIES = ENT_COLS * ENT_ROWS; // 72

const ENT_WIDTH  = 1.0;
const ENT_HEIGHT = 0.5;

const palxelProperty = (n) => `au12jp:palxel_${n}`;
const DYNAMIC_PROPERTY_INDEX = "palxel_index";

// ── RGB ↔ packed int ─────────────────────────────────

function packRGB(r, g, b)  { return r * 65536 + g * 256 + b; }
function unpackRGB(packed) { return { r: Math.floor(packed / 65536), g: Math.floor((packed % 65536) / 256), b: packed % 256 }; }
function RGBtoHEX(r, g, b) {
    const c = (n) => Math.round(Math.max(0, Math.min(255, n)));
    return ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1).toUpperCase();
}

// ── エンティティ管理 ──────────────────────────────────

export function getAllPalxels() {
    const dims = ["overworld", "nether", "the_end"].flatMap((id) => {
        try { return [world.getDimension(id)]; } catch { return []; }
    });
    return dims.flatMap((dim) => dim.getEntities({ type: ENTITY_TYPE }));
}

function getPalxelByIndex(index) {
    return getAllPalxels().find(
        (e) => e.getDynamicProperty(DYNAMIC_PROPERTY_INDEX) === index
    ) ?? null;
}

function refreshEntity(entity) {
    try {
        const idx = entity.getDynamicProperty(DYNAMIC_PROPERTY_INDEX);
        if (idx === undefined) return null;
        return getPalxelByIndex(idx);
    } catch { return null; }
}

// ── RGB 読み書き ──────────────────────────────────────

export function getPalxelRGB(entity, n) {
    try { return unpackRGB(entity.getProperty(palxelProperty(n)) ?? 0); } catch {}
    return { r: 0, g: 0, b: 0 };
}

export function setPalxelRGB(r, g, b, entity, n) {
    try {
        r = Math.round(Math.max(0, Math.min(255, r)));
        g = Math.round(Math.max(0, Math.min(255, g)));
        b = Math.round(Math.max(0, Math.min(255, b)));
        entity.setProperty(palxelProperty(n), packRGB(r, g, b));
    } catch {}
}

export function setAllPalxels(colours, entity) {
    for (let n = 0; n < PALXEL_COUNT; n++) {
        const c = colours[n] ?? { r: 0, g: 0, b: 0 };
        setPalxelRGB(c.r, c.g, c.b, entity, n);
    }
}

// ── グリッド召喚 ──────────────────────────────────────

export function spawnPalxelGrid(dimension, origin) {
    for (const e of getAllPalxels()) { try { e.remove(); } catch {} }

    let i = 0;
    for (let row = 0; row < ENT_ROWS; row++) {
        for (let col = 0; col < ENT_COLS; col++) {
            const index = i++;
            system.runTimeout(() => {
                const entity = dimension.spawnEntity(ENTITY_TYPE, {
                    x: origin.x + col * ENT_WIDTH,
                    y: origin.y + row * ENT_HEIGHT,
                    z: origin.z,
                });
                entity.setDynamicProperty(DYNAMIC_PROPERTY_INDEX, index);
                for (let n = 0; n < PALXEL_COUNT; n++) {
                    entity.setProperty(palxelProperty(n), 0);
                }
            }, index);
        }
    }
}

// ── ランダムアニメーション ────────────────────────────

let randomAnimRunning = false;
let randomAnimId      = -1;

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function tickRandomColors() {
    const entities = getAllPalxels();
    for (const entity of entities) {
        try {
            for (let n = 0; n < PALXEL_COUNT; n++) {
                entity.setProperty(
                    palxelProperty(n),
                    packRGB(randomInt(0, 255), randomInt(0, 255), randomInt(0, 255))
                );
            }
        } catch {}
    }
}

function startRandomAnim() {
    if (randomAnimRunning) return;
    randomAnimRunning = true;

    const loop = () => {
        if (!randomAnimRunning) return;
        tickRandomColors();
        randomAnimId = system.runTimeout(loop, 1);
    };
    randomAnimId = system.runTimeout(loop, 1);
}

function stopRandomAnim() {
    randomAnimRunning = false;
    if (randomAnimId !== -1) {
        system.clearRun(randomAnimId);
        randomAnimId = -1;
    }
}

function toggleRandomAnim(player) {
    if (randomAnimRunning) {
        stopRandomAnim();
        player.sendMessage("§eランダムアニメーション: §cOFF");
    } else {
        startRandomAnim();
        player.sendMessage("§eランダムアニメーション: §aON");
    }
}

// ── UI ───────────────────────────────────────────────

export function showPalxelForm(player) {
    const entities = getAllPalxels();

    if (entities.length === 0) {
        new ActionFormData()
            .title("Palxel")
            .body("エンティティが存在しません。\nグリッドを召喚してください。")
            .button("§aグリッド召喚（72体）")
            .show(player)
            .then((res) => {
                if (!res.canceled && res.selection === 0) {
                    spawnPalxelGrid(player.dimension, player.location);
                    player.sendMessage("§aグリッドを召喚しています...");
                }
            });
        return;
    }

    const animLabel = randomAnimRunning
        ? "§eランダムアニメ §a[ON]  §7→ OFFにする"
        : "§eランダムアニメ §c[OFF] §7→ ONにする";

    const pos    = player.location;
    const distSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
    const sorted = [...entities].sort((a, b) => distSq(a.location, pos) - distSq(b.location, pos));

    const form = new ActionFormData()
        .title("Palxel")
        .body(`64×36px (16:9) | ${entities.length}/${TOTAL_ENTITIES}体`);

    // ボタン構成:
    // 0              : アニメトグル
    // 1〜displayCount: エンティティ選択
    // displayCount+1 : リセット
    form.button(animLabel);

    const displayCount = Math.min(sorted.length, 10);
    for (let i = 0; i < displayCount; i++) {
        const e      = sorted[i];
        const idx    = e.getDynamicProperty(DYNAMIC_PROPERTY_INDEX) ?? "?";
        const entCol = idx % ENT_COLS;
        const entRow = Math.floor(idx / ENT_COLS);
        const dist   = Math.sqrt(distSq(e.location, pos)).toFixed(1);
        form.button(`§e#${idx} §7[${entCol},${entRow}] [${dist}m]`);
    }
    form.button("§cリセット（全削除 & 再召喚）");

    form.show(player).then((res) => {
        if (res.canceled) return;
        if (res.selection === 0) {
            toggleRandomAnim(player);
        } else if (res.selection === displayCount + 1) {
            showResetConfirmForm(player);
        } else {
            showPalxelSelectForm(player, sorted[res.selection - 1]);
        }
    });
}

function showPalxelSelectForm(player, entity) {
    const fresh = refreshEntity(entity);
    if (!fresh) { player.sendMessage("§cエンティティが見つかりません"); return; }

    const idx    = fresh.getDynamicProperty(DYNAMIC_PROPERTY_INDEX) ?? "?";
    const entCol = idx % ENT_COLS;
    const entRow = Math.floor(idx / ENT_COLS);

    const form = new ActionFormData()
        .title(`エンティティ [${entCol},${entRow}] - ピクセル選択`)
        .body("編集するピクセルを選んでください（8×4）");

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 8; col++) {
            const n = row * 8 + col;
            const { r, g, b } = getPalxelRGB(fresh, n);
            form.button(`§7[${col},${row}] §f#${RGBtoHEX(r, g, b)}`);
        }
    }
    form.button("§cリセット（全削除 & 再召喚）");

    form.show(player).then((res) => {
        if (res.canceled) return;
        const latest = refreshEntity(fresh);
        if (!latest) { player.sendMessage("§cエンティティが見つかりません"); return; }
        if (res.selection === PALXEL_COUNT) {
            showResetConfirmForm(player);
        } else {
            showRGBEditForm(player, latest, res.selection);
        }
    });
}

function showRGBEditForm(player, entity, n) {
    const fresh = refreshEntity(entity);
    if (!fresh) { player.sendMessage("§cエンティティが見つかりません"); return; }

    const { r, g, b } = getPalxelRGB(fresh, n);
    const idx    = fresh.getDynamicProperty(DYNAMIC_PROPERTY_INDEX) ?? "?";
    const entCol = idx % ENT_COLS;
    const entRow = Math.floor(idx / ENT_COLS);
    const pxCol  = n % 8;
    const pxRow  = Math.floor(n / 8);

    const globalCol = entCol * 8 + pxCol;
    const globalRow = entRow * 4 + pxRow;

    new ModalFormData()
        .title(`px[${globalCol},${globalRow}] - RGB設定`)
        .slider("R (赤)  0–255", 0, 255, 1, r)
        .slider("G (緑)  0–255", 0, 255, 1, g)
        .slider("B (青)  0–255", 0, 255, 1, b)
        .show(player)
        .then((res) => {
            if (res.canceled) return;
            const latest = refreshEntity(fresh);
            if (!latest) { player.sendMessage("§cエンティティが見つかりません"); return; }
            const newR = Math.round(res.formValues[0]);
            const newG = Math.round(res.formValues[1]);
            const newB = Math.round(res.formValues[2]);
            setPalxelRGB(newR, newG, newB, latest, n);
            player.sendMessage(`§apx[${globalCol},${globalRow}] → #${RGBtoHEX(newR, newG, newB)} RGB(${newR},${newG},${newB})`);
        });
}

function showResetConfirmForm(player) {
    new ActionFormData()
        .title("リセット確認")
        .body("全エンティティを削除しグリッドを再召喚します。\n本当によいですか？")
        .button("§cはい、リセットする")
        .button("キャンセル")
        .show(player)
        .then((res) => {
            if (!res.canceled && res.selection === 0) {
                stopRandomAnim();
                spawnPalxelGrid(player.dimension, player.location);
                player.sendMessage("§eリセットしました。グリッドを召喚しています...");
            }
        });
}

// ── イベント ──────────────────────────────────────────

// /scriptevent au12jp:palxel       → UIを開く
// /scriptevent au12jp:palxel_anim  → UIなしでアニメをトグル
system.afterEvents.scriptEventReceive.subscribe((ev) => {
    const player = ev.sourceEntity;
    if (!player || player.typeId !== "minecraft:player") return;

    if (ev.id === "au12jp:palxel") {
        showPalxelForm(player);
    } else if (ev.id === "au12jp:palxel_anim") {
        toggleRandomAnim(player);
    }
}, { namespaces: ["au12jp"] });