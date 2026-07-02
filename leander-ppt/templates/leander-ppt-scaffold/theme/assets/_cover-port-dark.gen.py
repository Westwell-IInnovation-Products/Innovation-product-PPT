# -*- coding: utf-8 -*-
# Leander Global 封面港口剪影 v2：超采样抗锯齿 + 更精细多样的元素
# （炼化塔群 / 多台岸桥含小车与吊具 / 集装箱船 / 码头建筑 / 水面等深线）。
from PIL import Image, ImageDraw

W, H = 1920, 1080
S = 3                      # 超采样倍数
NAVY_TOP = (12, 24, 37)
NAVY_BOT = (4, 8, 14)
CY  = (60, 196, 224)       # 主线 cyan
CY2 = (42, 132, 168)       # 次线 暗 cyan
HOR = 762                  # 水平线（final 坐标）

# ---- 背景渐变（1xH 竖条拉伸，无 numpy）----
strip = Image.new("RGB", (1, H))
sp = strip.load()
for y in range(H):
    t = y / (H - 1)
    sp[0, y] = (int(NAVY_TOP[0]*(1-t)+NAVY_BOT[0]*t),
                int(NAVY_TOP[1]*(1-t)+NAVY_BOT[1]*t),
                int(NAVY_TOP[2]*(1-t)+NAVY_BOT[2]*t))
bg = strip.resize((W, H))

# ---- azure 辉光 ----
glow = Image.new("L", (W, H), 0)
gd = ImageDraw.Draw(glow)
cx, cy = int(W * 0.6), HOR - 40
for rad in range(560, 0, -6):
    a = int(34 * (1 - rad / 560))
    gd.ellipse([cx - rad, cy - rad // 2, cx + rad, cy + rad // 2], fill=a)
bg = Image.composite(Image.new("RGB", (W, H), (16, 92, 120)), bg, glow.point(lambda v: v))

# ---- 线稿层（3x 超采样）----
LW, LH = W * S, H * S
art = Image.new("RGBA", (LW, LH), (0, 0, 0, 0))
d = ImageDraw.Draw(art)
hor = HOR * S

def col(c, a): return (c[0], c[1], c[2], a)
def line(x1, y1, x2, y2, w=1.2, c=CY, a=215):
    d.line([(x1*S, y1*S), (x2*S, y2*S)], fill=col(c, a), width=max(1, int(round(w*S))))
def poly(pts, w=1.2, c=CY, a=215, fill=None):
    P = [(x*S, y*S) for x, y in pts]
    if fill: d.polygon(P, fill=fill)
    d.line(P + [P[0]], fill=col(c, a), width=max(1, int(round(w*S))))
def arc(box, a0, a1, w=1.2, c=CY, a=215):
    d.arc([box[0]*S, box[1]*S, box[2]*S, box[3]*S], a0, a1, fill=col(c, a), width=max(1, int(round(w*S))))
def circ(x, y, r, w=1.2, c=CY, a=215):
    d.ellipse([(x-r)*S, (y-r)*S, (x+r)*S, (y+r)*S], outline=col(c, a), width=max(1, int(round(w*S))))
def rectln(x1, y1, x2, y2, w=1.1, c=CY, a=200, fill=None):
    if fill: d.rectangle([x1*S, y1*S, x2*S, y2*S], fill=fill)
    d.rectangle([x1*S, y1*S, x2*S, y2*S], outline=col(c, a), width=max(1, int(round(w*S))))

# ---- 炼化塔群（左）----
def refinery(x0):
    base = hor // S
    # 三根精馏塔，高度递变
    for i, (dx, h, wdt) in enumerate([(0, 250, 26), (54, 300, 22), (104, 210, 18)]):
        x = x0 + dx
        rectln(x, base - h, x + wdt, base, w=1.0, c=CY, a=200)
        for yy in range(base - h + 16, base, 26):          # 横向分段
            line(x, yy, x + wdt, yy, w=0.7, c=CY2, a=130)
        rectln(x - 3, base - h - 8, x + wdt + 3, base - h, w=0.9, c=CY, a=200)  # 塔顶
    # 火炬塔 + 小火苗
    fx = x0 + 150
    line(fx, base, fx, base - 240, w=1.0, c=CY, a=190)
    line(fx - 8, base - 230, fx, base - 240, w=0.8, c=CY, a=170)
    line(fx + 8, base - 230, fx, base - 240, w=0.8, c=CY, a=170)
    poly([(fx-7, base-240), (fx, base-262), (fx+7, base-240)], w=0.9, c=CY, a=210)
    # 球罐
    circ(x0 + 12, base - 18, 18, w=0.9, c=CY, a=180)
    circ(x0 + 50, base - 16, 14, w=0.9, c=CY, a=180)
    # 管廊
    line(x0 - 16, base - 40, x0 + 130, base - 40, w=0.8, c=CY2, a=140)
    line(x0 - 16, base - 30, x0 + 130, base - 30, w=0.8, c=CY2, a=140)

# ---- 岸桥（STS quay crane）含小车、吊具 ----
def quay_crane(x, scale=1.0, a=220, trolley=0.5):
    base = hor // S
    legH = int(150 * scale)
    gap = int(120 * scale)
    boomY = base - legH
    apex = boomY - int(86 * scale)
    boomLen = int(330 * scale)
    L_, R_ = x - gap//2, x + gap//2
    # 立柱
    for lx in (L_, R_):
        line(lx, boomY, lx, base, w=1.3, c=CY, a=a)
    line(L_, boomY + 18, R_, base - 8, w=0.7, c=CY2, a=120)   # 交叉撑
    line(R_, boomY + 18, L_, base - 8, w=0.7, c=CY2, a=120)
    # 门梁
    line(L_-8, boomY, R_+8, boomY, w=1.3, c=CY, a=a)
    # A 形塔架
    line(x, apex, L_, boomY, w=1.1, c=CY, a=a)
    line(x, apex, R_, boomY, w=1.1, c=CY, a=a)
    line(x-int(14*scale), apex+2, x+int(14*scale), apex+2, w=1.0, c=CY, a=a)
    # 大梁（海侧下倾）+ 后拉杆
    bx = x + boomLen
    line(L_-int(70*scale), boomY-6, bx, boomY-int(30*scale), w=1.4, c=CY, a=a)   # 海侧悬臂
    line(L_-int(70*scale), boomY+8, bx, boomY-int(16*scale), w=0.8, c=CY2, a=130)
    line(x, apex, bx, boomY-int(30*scale), w=0.8, c=CY2, a=140)                   # 前拉索
    line(x, apex, L_-int(70*scale), boomY-2, w=0.8, c=CY2, a=140)                # 后拉索
    line(x-int(150*scale), boomY-int(6*scale), L_-int(70*scale), boomY-6, w=1.2, c=CY, a=a)  # 陆侧梁
    # 小车 + 吊具 + 吊绳
    tx = L_-int(70*scale) + int((bx - (L_-int(70*scale))) * trolley)
    ty = boomY - int(30*scale) + int((boomY-6 - (boomY-int(30*scale))) * trolley)
    rectln(tx-7, ty-2, tx+7, ty+7, w=0.9, c=CY, a=a)
    line(tx, ty+7, tx, ty+int(40*scale), w=0.7, c=CY, a=170)
    rectln(tx-10, ty+int(40*scale), tx+10, ty+int(50*scale), w=0.9, c=CY, a=a)   # 吊具

# ---- 集装箱船 ----
def ship(x, a=200):
    base = hor // S
    L_ = 360
    poly([(x, base), (x+L_, base), (x+L_-34, base+26), (x+26, base+26)],
         w=1.1, c=CY, a=a, fill=(8, 26, 38, 150))
    line(x+8, base, x+L_-8, base, w=0.9, c=CY, a=180)
    # 甲板集装箱网格
    cw, ch = 30, 11
    for r in range(4):
        n = 10 - r
        for c2 in range(n):
            xx = x + 26 + c2 * (cw+2)
            yy = base - (r+1)*ch
            rectln(xx, yy, xx+cw, yy+ch-2, w=0.6, c=CY2, a=120)
    # 船艏起重机/桅
    line(x+L_-40, base, x+L_-40, base-58, w=0.9, c=CY, a=170)
    line(x+L_-40, base-58, x+L_-8, base-40, w=0.8, c=CY2, a=140)

# ---- 右侧码头建筑群 ----
def terminal(x0):
    base = hor // S
    # 穹顶建筑
    arc([x0, base-78, x0+96, base+18], 180, 360, w=1.0, c=CY, a=190)
    rectln(x0, base-30, x0+96, base, w=0.9, c=CY, a=180)
    line(x0+48, base-78, x0+48, base-96, w=0.9, c=CY, a=180)
    circ(x0+48, base-100, 4, w=0.9, c=CY, a=190)
    # 控制塔
    line(x0+150, base, x0+150, base-210, w=1.1, c=CY, a=190)
    rectln(x0+138, base-232, x0+170, base-210, w=0.9, c=CY, a=190)
    # RTG over container stacks
    for k in range(2):
        gx = x0 + 230 + k*150
        line(gx, base, gx, base-92, w=1.0, c=CY, a=180)
        line(gx+110, base, gx+110, base-92, w=1.0, c=CY, a=180)
        line(gx-6, base-92, gx+116, base-92, w=1.1, c=CY, a=190)
        for r in range(3):
            for c2 in range(4):
                xx = gx+14 + c2*24; yy = base-(r+1)*12
                rectln(xx, yy, xx+22, yy+10, w=0.6, c=CY2, a=110)
    # 远景薄楼
    for bx, bh in [(x0+540,150),(x0+575,200),(x0+612,120)]:
        rectln(bx, base-bh, bx+24, base, w=0.8, c=CY2, a=120)

# ---- 前景水面等深线 ----
def water():
    base = hor // S
    import math
    for i in range(7):
        yy = base + 18 + i*26
        pts = []
        for t in range(0, W+1, 40):
            pts.append((t, yy + int(6*math.sin(t/120.0 + i))))
        d.line([(px*S, py*S) for px, py in pts], fill=col(CY2, max(20, 90 - i*11)), width=max(1, int(0.9*S)))

# ---- 远处客机（极淡）----
def plane(x, y):
    line(x, y, x+58, y+6, w=1.0, c=CY2, a=90)
    line(x+40, y-9, x+50, y+5, w=1.0, c=CY2, a=90)
    line(x+40, y+14, x+50, y+6, w=1.0, c=CY2, a=90)

# 组合
refinery(70)
ship(150)
quay_crane(470, 1.06, 230, 0.62)
quay_crane(720, 0.96, 215, 0.42)
quay_crane(965, 1.12, 235, 0.7)
quay_crane(1210, 0.92, 205, 0.5)
terminal(1250)
water()
plane(1330, 250)

# 水平线
line(0, HOR//1, W, HOR//1, w=1.0, c=CY, a=70)

art_s = art.resize((W, H), Image.LANCZOS)
out = bg.convert("RGBA")
out.alpha_composite(art_s)
out = out.convert("RGB")
out.save(r"C:\Users\admin\.claude\skills\leander-ppt\templates\leander-ppt-scaffold\theme\assets\cover-port-dark.png")
out.resize((760, 428)).save(r"C:\tmp\_cover2_preview.png")
print("wrote cover v2")
