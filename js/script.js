// globals
var current_timer = null
var number_of_questions = 10
var number_of_seconds = 5500  // slightly over because it'll round down
var questions = null

// at startup
document.addEventListener("DOMContentLoaded", function(event) {
    document.getElementById("numqs").value = number_of_questions
    document.getElementById("timeperq").value = Math.floor(number_of_seconds / 1000)
});


function randomIntFromInterval(min, max)
{
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function Question(lhs, rhs)
{
    this.lhs = lhs
    this.rhs = rhs
    this.answer = lhs * rhs
}

function Questions()
{
    list = []
    // generate unique questions - duplicates are discarded and tried again
    // note that X x Y is a different question to Y x X even though it's the same answer
    for (n = 0; n < number_of_questions; ++n)
    {
        while (true)
        {
            q = new Question(randomIntFromInterval(1, 12), randomIntFromInterval(1, 12))
            found = false
            for (i = 0; i < list.length; ++i)
            {
                if (JSON.stringify(list[i]) == JSON.stringify(q))
                {
                    console.warn(`Found dup! ${q.lhs} ${q.rhs} at ${i}`)
                    found = true
                    break
                }
            }
            if (!found)
            {
                console.info(`${i}: No dup! ${q.lhs} ${q.rhs}`)
                list.push(q)

                // break out of while loop
                break
            }
        }
    }
    return list
}

function makeQuestionUI()
{
    var outerdiv = document.createElement("div")
    outerdiv.id = "outerdiv"
    for (i = 0; i < questions.length; ++i)
    {
        var div = document.createElement("div")
        div.id = `div${i}`
        div.className = "question"
        div.style.display = "none"

        var question = document.createTextNode(`${questions[i].lhs} x ${questions[i].rhs} =`)
        var x = document.createElement("input");
        x.id = `answer${i}`
        x.classname = "answer"
        x.question_index = i
        x.autocomplete = false
        x.setAttribute("type", "text");
        x.addEventListener("keydown", function (e) {
            if (e.code === "Enter") {
                validate(e.target);
            }
        });

        div.appendChild(question)
        div.appendChild(x)
        outerdiv.appendChild(div)
    }
    document.body.appendChild(outerdiv)
}

function removeQuestionUI()
{
    var outerdiv = document.getElementById("outerdiv")
    if (document.contains(outerdiv))
    {
        outerdiv.remove()
    }
}

function validate(answer)
{
    current_timer.stop()

    index = answer.question_index

    answered = document.getElementById(`div${index}`)
    if (answer.value == questions[index].answer)
    {
        answer.style.background = "green"
        answer.value += " ✔"
    }
    else
    {
        answer.style.background = "red"
        answer.value += " ✗"
    }

    next_index = index + 1
    if (next_index == number_of_questions)
    {
        document.getElementById("startbutton").disabled = false
        document.getElementById("countdown").textContent = "Finished!"
        return
    }

    next = document.getElementById(`div${next_index}`)
    next.style.display = "block"

    document.getElementById(`answer${next_index}`).focus()

    // start the next timer
    current_timer = new countdown(next_index)
}

var countdown = function(question_index)
{
    thing = document.getElementById("countdown")
    interval = setInterval(doit, 1000)
    start = Date.now()
    total = number_of_seconds
    thing.textContent = Math.floor(total / 1000)

    function doit()
    {
        next = Math.floor((total - (Date.now() - start)) / 1000)
        thing.textContent = next
        if (next == 0)
        {
            // signal to check
            validate(document.getElementById(`answer${question_index}`))
        }
    }

    function stop()
    {
        clearInterval(interval)
        interval = null
    }

    // make a public API
    this.stop = stop
}

function onStart(id)
{
    // hide the button
    document.getElementById(id).disabled = true

    // fetch modifications to the number of questions and time
    number_of_questions = document.getElementById("numqs").value
    number_of_seconds = document.getElementById("timeperq").value * 1000 + 500

    // create the questions
    questions = Questions()
    removeQuestionUI()
    makeQuestionUI()

    // show first question
    first_question = document.getElementById("div0")
    first_question.style.display = "block"
    document.getElementById("answer0").focus()

    // start the timer
    if (current_timer != null)
    {
        current_timer.stop()
    }
    current_timer = new countdown(0)
}
