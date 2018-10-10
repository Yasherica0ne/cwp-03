const net = require('net');
const fs = require('fs');
const port = 8124;

const client = new net.Socket();

const clientStartStr = 'QA';
const serverAcceptStr = 'ACK';
const serverDeclineStr = 'DEC';

let isStartingConnection = true;
let questionCounter = 0;
let arr;

function SwapElements(ind1, ind2)
{
    const temp = arr[ind1];
    arr[ind1] = arr[ind2];
    arr[ind2] = temp;
}

function GetRandomIndex(arrayLength)
{
    var rand = Math.random() * (arrayLength -1);
    rand = Math.floor(rand);
    return rand;
}

function GetQuestionObject()
{
    return arr[questionCounter++];
}

function MixQuestions()
{
    for(let i = 0; i < arr.length; i++)
    {
        while(true)
        {
            let ind1 = GetRandomIndex(arr.length);
            let ind2 = GetRandomIndex(arr.length);
            if (ind1 !== ind2) 
            {
                SwapElements(ind1, ind2);
                break;
            }
        }
    }
}

function AskQuestion()
{
    if(questionCounter == arr.length) return false;
    else
    {
        client.write(arr[questionCounter].question);
        return true;
    }
}

client.setEncoding('utf8');

client.connect(port, function() {
  console.log('Connected');
  client.write(clientStartStr);
});

client.on('data', function(data) {
    if(data === serverDeclineStr)
    {
        client.destroy();
    }
    else if(data === serverAcceptStr)
    {
        isStartingConnection = false;
        fs.readFile('qa.json', (err, text) => {
            if (!err)
            {
                 arr = JSON.parse(text);
                 MixQuestions();
                 AskQuestion();
            }
            else console.log(err);

        });
    }
    else
    {
        const Question = GetQuestionObject();
        console.log(`Question: ${Question.question}`);
        if(data === 'good')
        {
            console.log(`Answer: ${Question.goodAnswer}`);
        }
        else if(data === 'bad')
        {
            console.log(`Answer: ${Question.badAnswer}`);
        }
        if(!AskQuestion())
        {
            client.destroy();
        }
    }
});

client.on('close', function() {
    console.log('Connection closed');
});