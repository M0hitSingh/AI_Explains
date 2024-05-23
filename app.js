function uploadImage() {
    const form = document.getElementById('uploadForm');
    const formData = new FormData(form);

    fetch('http://localhost:3000/', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        alert('Image and question uploaded successfully!');
        console.log(data);
    })
    .catch(error => console.error('Error:', error));
}
