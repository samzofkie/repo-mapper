//https://stackoverflow.com/a/21015393/13387094
export class FontSizer {
  static canvas = document.createElement('canvas');

  static getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
  }

  static getCanvasFont(el = document.body) {
    const fontWeight = FontSizer.getCssStyle(el, 'font-weight') || 'normal';
    const fontSize = FontSizer.getCssStyle(el, 'font-size') || '16px';
    const fontFamily = FontSizer.getCssStyle(el, 'font-family') || 'Times New Roman';
    return `${fontWeight} ${fontSize} ${fontFamily}`;
  }

  static getTextMetrics(text, font) {
    const context = FontSizer.canvas.getContext("2d");
    context.font = font;
    return context.measureText(text);
  }

  static getTextWidth(text, font) {
    return FontSizer.getTextMetrics(text, font).width;
  }
}