// globals
var current_timer = null
var number_of_questions = 10
var number_of_seconds = 5500  // slightly over because it'll round down
var questions = null
var total_correct = 0

// at startup
document.addEventListener("DOMContentLoaded", function(event) {
    document.getElementById("numqs").value = number_of_questions
    document.getElementById("timeperq").value = Math.floor(number_of_seconds / 1000)
})

// generate a random integer within the bounds [min, max]
function randomIntFromInterval(min, max)
{
    return Math.floor(Math.random() * (max - min + 1) + min)
}

// generate a Question object containing the numbers to the left-hand-side,
// right-hand-side, and storing the answer to compare against later
function Question(lhs, rhs)
{
    this.lhs = lhs
    this.rhs = rhs
    this.answer = lhs * rhs
}

// generate a list of N questions, where N is the number of questions
// the questions must not repeat (each are unique), although X x Y is considered
// different to Y x X
function Questions()
{
    list = []
    for (n = 0; n < number_of_questions; ++n)
    {
        // this loop is broken out of when a unique question is added to the list
        while (true)
        {
            q = new Question(randomIntFromInterval(1, 12), randomIntFromInterval(1, 12))
            found = false
            for (i = 0; i < list.length; ++i)
            {
                if (JSON.stringify(list[i]) == JSON.stringify(q))
                {
                    found = true
                    // break out of the comparison 'for' loop
                    break
                }
            }
            if (!found)
            {
                list.push(q)
                // break out of the outer 'while' loop
                break
            }
        }
    }
    return list
}

// create the HTML elements for the questions
function makeQuestionUI()
{
    // this is the div that contains all of the questions
    var outer_container = document.createElement("div")
    outer_container.id = "outer_container"

    for (i = 0; i < questions.length; ++i)
    {
        // this is the div that contains the question and answer input
        var question_container = document.createElement("div")
        question_container.id = `question_container_${i}`
        question_container.className = "question_container"

        // just a label with the question
        var question = document.createElement("p")
        question.innerHTML = `${questions[i].lhs} x ${questions[i].rhs} =`
        question.className = "question"

        // an input box for the answer
        var answer = document.createElement("input")
        answer.setAttribute("type", "text")

        answer.id = `answer_${i}`
        answer.className = "answer"
        answer.autocomplete = false // don't suggest answers

        answer.question_index = i // a custom attribute to record which question was asked

        // listen for when the user presses the Enter key
        // in order to check the answer
        answer.addEventListener("keydown", function (e)
        {
            if (e.code === "Enter")
            {
                check_answer(e.target)
            }
        })

        // now store the question label and input in the question div
        question_container.appendChild(question)
        question_container.appendChild(answer)

        // now store the question div in the outer div
        outer_container.appendChild(question_container)
    }

    // correct and incorrect images, randomly chosen
    var num_correct_images = 4
    correct_image_index = randomIntFromInterval(1, num_correct_images)

    var correct_image = document.createElement("img")
    correct_image.id = "correct"
    correct_image.setAttribute("src", `img/correct/${correct_image_index}.JPG`)
    outer_container.appendChild(correct_image)

    var num_incorrect_images = 4
    incorrect_image_index = randomIntFromInterval(1, num_incorrect_images)

    var incorrect_image = document.createElement("img")
    incorrect_image.id = "incorrect"
    incorrect_image.setAttribute("src", `img/incorrect/${incorrect_image_index}.JPG`)
    outer_container.appendChild(incorrect_image)

    correct_image.style.display = "none"
    incorrect_image.style.display = "none"

    // now store the outer div in the web page
    document.body.appendChild(outer_container)
}

// remove the UI for questions
function removeQuestionUI()
{
    var outer_container = document.getElementById("outer_container")
    if (document.contains(outer_container))
    {
        outer_container.remove()
    }
}

// check whether the answer given is right
// this might happen if the user has pressed enter
// or if the timeout has occurred
// mark the answer as correct or incorrect
// unhide the next question
// move the focus to the input for the next answer
// restart the timer
// if finished, enable the startbutton and declare finished
function check_answer(answer)
{
    current_timer.stop()
    answer.blur()
    answer.disabled = true

    index = answer.question_index

    success = answer.value == questions[index].answer

    if (success)
    {
        answer.className = "correct_answer"
        answer.value += " ✔"
        total_correct += 1
    }
    else
    {
        answer.className = "incorrect_answer"
        answer.value += ` ✗ (= ${questions[index].answer})`
    }

    next_index = index + 1
    if (next_index == number_of_questions)
    {
        start_button = document.getElementById("startbutton").disabled = false

        document.getElementById("countdown").innerHTML = `Completed <sup>${total_correct}</sup> &frasl; <sub>${number_of_questions}</sub>`

        if (total_correct == number_of_questions)
        {
            document.getElementById("correct").style.display = "block"

            confetti({
                particleCount: 1000,
                spread: 90, // wide angle
                origin: { y: 1.0 }, // from bottom of screen
                shapes: ["star"],
              });
        }
        else
        {
            document.getElementById("incorrect").style.display = "block"
        }

        return
    }

    next = document.getElementById(`question_container_${next_index}`)
    next.style.display = "flex"

    document.getElementById(`answer_${next_index}`).focus()

    // start the next timer
    current_timer = new countdown(next_index)
}

// call this to create a countdown timer
var countdown = function(question_index)
{
    text_element = document.getElementById("countdown")
    interval = setInterval(do_tick, 1000)
    start = Date.now()
    total = number_of_seconds
    text_element.textContent = Math.floor(total / 1000)

    function do_tick()
    {
        next_number = Math.floor((total - (Date.now() - start)) / 1000)
        text_element.textContent = next_number
        if (next_number == 0)
        {
            // signal to check
            check_answer(document.getElementById(`answer_${question_index}`))
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

// this is called when the user presses the Start button
function onStart(id)
{
    // don't let anyone press Start again until finished
    document.getElementById(id).disabled = true

    // fetch modifications to the number of questions and time
    number_of_questions = document.getElementById("numqs").value
    number_of_seconds = document.getElementById("timeperq").value * 1000 + 500

    // create the questions
    questions = Questions()
    removeQuestionUI()
    makeQuestionUI()

    total_correct = 0

    // show first question
    first_question = document.getElementById("question_container_0")
    first_question.style.display = "flex"
    document.getElementById("answer_0").focus()

    // start the timer
    if (current_timer != null)
    {
        current_timer.stop()
    }
    current_timer = new countdown(0)
}
