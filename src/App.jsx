/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react'
import names from './assets/names.json'
import './App.css'

function App() {
	const img = useRef()
	const input = useRef()
	const loopProgress = useRef() // for animating progress bar
	const deadline = useRef() // deadline for each round
	const optionsParent = useRef()

	const [eventEnabled, setEventEnabled] = useState(true) // disable event during answer display
	const [shipName, setShipName] = useState('') // main ship name
	const [isCorrectAnswer, setIsCorrectAnswer] = useState(null)
	const [gameRunning, setGameRunning] = useState()
	const [gameEnd, setGameEnd] = useState()
  const [pickedIndices, setPickedIndices] = useState([]) // stores indices of shown ships
	const [rounds, setRounds] = useState()
	const [progress, setProgress] = useState(0) // progress bar
	const [suggestions, setSuggestions] = useState([])
	const [optionIndex, setOptionIndex] = useState(-1) // for highlighting options

	const [score, setScore] = useState()
	const [avgSpeed, setAvgSpeed] = useState()
	const [answerLog, setAnswerLog] = useState([])

	const delay = () => new Promise(resolve => setTimeout(resolve, 1000))

	const setInputText = (e) => input.current.value = e.target.textContent

	function showSuggestions() {
		const suggestions = names.map(i => i['filename']).filter((word) =>
			word.toLowerCase().includes(input.current.value.toLowerCase())
		)
		setSuggestions(suggestions)
	}

	function loadImage(url) {
		return new Promise((resolve, reject) => {
			const image = new Image()
			image.onload = () => resolve(image)
			image.onerror = (error) => reject(error)
			image.src = url
		})
	}

	function displayCorrectAnswer(isCorrect) {
		clearInterval(loopProgress.current)
		clearTimeout(deadline.current)
		setEventEnabled(false)

		loadImage(`https://raw.githubusercontent.com/risbi0/Whos-that-shipgirl/main/img/unhidden/${shipName}.png`)
			.then((image) => {
				img.current.src = image.src
				setIsCorrectAnswer(isCorrect)
				// show unhidden ship for a sec before going to next round
				return delay()
			})
			.then(() => {
				input.current.value = ''
				setEventEnabled(true)
				setProgress(0)
				newGameRound()
			})
	}

	function highlightOptions(e) {
		if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOptionIndex((index) => {
				let indexOut
				if (index < suggestions.length - 1) {
					indexOut = index + 1
				}  else {
					indexOut = index
				}
				input.current.value = suggestions[indexOut]
				return indexOut
			})
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOptionIndex((index) => {
				let indexOut
				if (index > 0) {
					indexOut = index - 1
				}  else {
					indexOut = -1
				}
				input.current.value = suggestions[indexOut]
				return indexOut
			})
    } else if (e.key === 'Enter' && optionIndex !== -1) {
			submitAnswer()
    }
	}

	function submitAnswer() {
		setSuggestions([])
		setOptionIndex(-1) // reset index for option selection
		checkAnswer()
	}

	function checkAnswer() {
		const answer = input.current.value
		if (eventEnabled) {
			if (answer === shipName) {
				// correct answer
				setScore((score) => score + 1)
				displayCorrectAnswer(true)
			} else {
				// incorrect answer
				displayCorrectAnswer(false)
			}
		}
  }

	function newGameRound() {
		setRounds((rounds) => rounds + 1)
		setIsCorrectAnswer(null)

		// pick new hidden ship
		let newShipPicked = false, randShipIndex
		while (!newShipPicked) {
			randShipIndex = Math.floor(Math.random() * names.length)

			if (!pickedIndices.includes(randShipIndex)) {
				setPickedIndices((pickedIndices) => {
					pickedIndices.push(randShipIndex)
					return pickedIndices
				})
				newShipPicked = true
			}
		}
		setShipName(names[randShipIndex]['filename'])
	}

	function startGame() {
		// reinit states
		setGameRunning(true)
		setGameEnd(false)
		setRounds(0)
		setPickedIndices([])
		setOptionIndex(-1)

		setScore(0)
		setAvgSpeed(0)
		setAnswerLog([])

		newGameRound()
	}

	useEffect(() => {
		if (shipName) {
			loadImage(`https://raw.githubusercontent.com/risbi0/Whos-that-shipgirl/main/img/hidden/${shipName}.png`)
			.then((image) => {
				if (img.current) {
					img.current.src = image.src

					const roundDuration = 10000
					const interval = 10
					const totalSteps = roundDuration / interval

					loopProgress.current = setInterval(() => {
						if (progress < 100) {
							setProgress((prevProgress) => prevProgress + (100 / totalSteps))
						}
					}, interval)

					deadline.current = setTimeout(() => {
						// not answered
						displayCorrectAnswer(false)
					}, roundDuration)
				}
			})
		}
	}, [shipName])

	useEffect(() => {
		// log answer details
		if (isCorrectAnswer !== null) {
			setAnswerLog(() => {
				answerLog.push({
					'isCorrect': isCorrectAnswer,
					'name': shipName,
					'answer': input.current.value,
					'speed': Math.round(progress * 10) / 100
				})
				return answerLog
			})
		}
		// end round
		if (rounds === 11) {
			clearInterval(loopProgress.current)
			clearTimeout(deadline.current)
			setGameRunning(false)
			setGameEnd(true)
			// calculate avg speed
			const getAllSpeed = answerLog.map(obj => obj['speed'])
			const addAllSpeed = getAllSpeed.reduce((total, current) => total + current)
			setAvgSpeed(Math.round(addAllSpeed * 10) / 100)
		}
	}, [rounds, isCorrectAnswer])

  return (
    <>
		{
			!gameRunning && !gameEnd &&
			<>
				<div id='answer-display'>Azur Lane Guessing Game</div>
				<div id='container'>
					<p>Guess the Azur Lane character by its silhouette!</p>
					<p>10 rounds with each round having a 10 second limit.</p>
					<p>No retrofit skins and skins in general.</p>
					<p>Some characters have nicknames which are also correct.</p>
					<p>Also includes sirens.</p>
				</div>
				<button onClick={startGame}>START</button>
			</>
		}
		{
			gameRunning && !gameEnd &&
			<>
				<div id='progress-bar' style={{width: `${progress}%`}}></div>
				<div
					id='answer-display'
					className={
						isCorrectAnswer !== null && isCorrectAnswer
							? 'correct-ans-glow'
							: isCorrectAnswer !== null && !isCorrectAnswer
								? 'wrong-ans-glow'
								: ''
					}>
						{isCorrectAnswer === null ? `Round ${rounds} of 10` : shipName}
				</div>
				<div id='container'>
					<img ref={img} src='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='/>
				</div>
				<div>
					<input
						type='text'
						ref={input}
						onInput={showSuggestions}
						onKeyDown={highlightOptions}
						placeholder='Who?'
						maxLength='30'>
					</input>
					{suggestions.length > 0 && (
						<div id='suggestions' ref={optionsParent}>
						{suggestions.map((suggestion, index) => (
							<div
								key={index}
								className={index === optionIndex ? 'selected' : ''}
								onMouseEnter={setInputText}
								onClick={submitAnswer}
							>
								{suggestion}
							</div>
						))}
					</div>
					)}
				</div>
			</>
		}
		{
			!gameRunning && gameEnd &&
			<>
				<div id='score'>
					<p>Score: {score} / 10</p>
					<p>Avg. Answer Speed: {avgSpeed}s</p>
				</div>
				<table>
					<thead>
						<tr>
							<th></th>
							<th>Name</th>
							<th>Answer / Speed</th>
						</tr>
					</thead>
					<tbody>
						{answerLog.map((answer, index) => (
							<tr key={index}>
								<td>{answer.isCorrect ? '✅' : '❌'}</td>
								<td>{answer.name}</td>
								<td style={answer.isCorrect ? {textAlign: 'center'} : {}}>
									{answer.isCorrect ? `${answer.speed}s` : answer.answer}
								</td>
							</tr>
						))}
					</tbody>
				</table>
				<button onClick={startGame}>PLAY AGAIN</button>
			</>
		}
    </>
  )
}

export default App
