import CoolImageEditor from './coolimageeditor.js';

let editor = new CoolImageEditor();
await editor.construct();
document.getElementById("main-container").append(editor.container);