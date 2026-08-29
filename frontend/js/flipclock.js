/* ============================================================
 * flipclock.js — iOS 翻页时钟组件
 * 用法：FlipClock.init(containerEl); FlipClock.update("HHMMSS")
 * 结构：6 张数字卡（时2/分2/秒2），每卡上下两半 + 翻页动画
 * ============================================================ */

const FlipClock = (() => {
  let container = null;
  let digits = []; // 每个元素 { el, topNum, bottomNum, current }

  /** 构建单张数字卡 */
  function buildDigit() {
    const d = document.createElement("div");
    d.className = "digit";
    d.innerHTML = `
      <div class="half top"><div class="num">0</div></div>
      <div class="half bottom"><div class="num">0</div></div>
    `;
    return {
      el: d,
      top: d.querySelector(".half.top .num"),
      bottom: d.querySelector(".half.bottom .num"),
      topHalf: d.querySelector(".half.top"),
      bottomHalf: d.querySelector(".half.bottom"),
      current: "0",
    };
  }

  function init(el) {
    container = el;
    container.innerHTML = "";
    digits = [];

    const groups = [2, 2, 2]; // 时、分、秒
    groups.forEach((count, gi) => {
      if (gi > 0) {
        const colon = document.createElement("div");
        colon.className = "colon";
        colon.textContent = ":";
        container.appendChild(colon);
      }
      const unit = document.createElement("div");
      unit.className = "flip-unit";
      for (let i = 0; i < count; i++) {
        const digit = buildDigit();
        digits.push(digit);
        unit.appendChild(digit.el);
      }
      container.appendChild(unit);
    });
  }

  /** 翻动单张卡片到新数字 */
  function flipOne(digit, next) {
    if (digit.current === next) return;

    const { el, topHalf, bottomHalf } = digit;

    // 1. 静置层先显示新数字（翻页时从它上面落下旧面）
    //    top half 仍显示旧数字并翻下去；bottom half 换成新数字
    digit.top.textContent = next;       // 翻完后上片内容 = 新数字
    digit.bottom.textContent = next;    // 下半片立刻显示新数字

    // 2. 克隆旧的上半片作为"翻下的那一片"
    const oldTop = document.createElement("div");
    oldTop.className = "half top flipping";
    oldTop.innerHTML = `<div class="num" style="top:0">${digit.current}</div>`;
    el.appendChild(oldTop);

    // 3. 克隆新数字的上半片，先隐藏在旧面下（z-index 较低）
    //    旧面翻走时露出它 —— 视觉上就是新数字落下

    // 4. 动画结束后清理
    const cleanup = () => {
      oldTop.remove();
      digit.current = next;
    };
    oldTop.addEventListener("animationend", cleanup, { once: true });

    // 下半片轻微闪动增强落感
    bottomHalf.classList.remove("flipping");
    void bottomHalf.offsetWidth; // reflow 重启动画
    bottomHalf.classList.add("flipping");
  }

  /** 更新时间字符串 "HHMMSS"（不校验格式，按位翻动） */
  function update(str) {
    if (!digits.length) return;
    for (let i = 0; i < digits.length && i < str.length; i++) {
      flipOne(digits[i], str[i]);
    }
  }

  return { init, update };
})();
