function calculate(operation) {
    const num1 = document.getElementById('num_1').value;
    const num2 = document.getElementById('num_2').value;
    
    const url = `http://localhost:8080/${operation}?num1=${num1}&num2=${num2}`;

    fetch(url, {
        credentials: 'include' // Ensures cookies are sent with the request
    })
    .then(response => response.json())
    .then(data => {
        if (data.statuscode === 200) {
            document.getElementById('result').textContent = data.data;
        } else {
            document.getElementById('result').textContent = data.message;
        }
    })
    .catch(error => {
        document.getElementById('result').textContent = 'Error: ' + error.message;
    });
}

function calSqrt() {
    document.getElementById('num_2').value = ''; 
    calculate('sqrt');
}
