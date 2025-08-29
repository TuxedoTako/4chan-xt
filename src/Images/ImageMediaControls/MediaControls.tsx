import h, { EscapedHtml } from "../../globals/jsx";
import $ from "../../platform/$";
import Icon from "../../Icons/icon";

export default function MediaControls(): EscapedHtml {
  return (
    <div class='media-controls'>
      <button data-action="rotateLeft">{Icon.raw('rotateLeft')}</button>
      <button data-action="rotateRight">{Icon.raw('rotateRight')}</button>
    </div>
  );
}
