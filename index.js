import CoolImageEditor from './public/coolimageeditor.js';

let editor;
await CoolImageEditor.loadIcons();

let fileInput = document.getElementById("file-input");
fileInput.onchange = () => {
  if (fileInput.files.length < 1) {
    return;
  }
  
  let file = fileInput.files[0];
  let img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = () => {
    if (!editor) {
      editor = new CoolImageEditor({
        file: file,
        img: img
      });
      
      document.getElementById("main-container").append(editor.container);
      editor.resizeCanvas();
    } else {
      editor.setImage({
        file: file,
        img: img
      });
    }
  };
};