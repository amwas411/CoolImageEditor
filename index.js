import CoolImageEditor from './coolimageeditor';

let fileInput = document.getElementById("file-input");
fileInput.onchange = () => {
  if (fileInput.files.length < 1) {
    return;
  }

  let file = fileInput.files[0];
  let img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = async () => {
    
    await CoolImageEditor.loadIcons();

    let editor = new CoolImageEditor({
      file: file,
      img: img
    });
    
    document.getElementById("main-container").append(editor.container);
  };
};