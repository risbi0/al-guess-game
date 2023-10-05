/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react'
import names from './assets/names.json'
import './App.css'

function App() {
	const input = useRef()
	const loopProgress = useRef() // for animating progress bar
	const deadline = useRef() // deadline for each round

	const [gameRunning, setGameRunning] = useState()
	const [gameEnd, setGameEnd] = useState()
	const [displayState, setDisplayState] = useState('hidden')
	const [isCorrectAnswer, setIsCorrectAnswer] = useState()
	const [answerLog, setAnswerLog] = useState([])
	const [score, setScore] = useState()
	const [avgSpeed, setAvgSpeed] = useState()
	const [rounds, setRounds] = useState()
	const [progress, setProgress] = useState(0) // progress bar
	const [shipName, setShipName] = useState('') // main ship name
	const [altNames, setAltNames] = useState() // alt ship names
	const [eventEnabled, setEventEnabled] = useState(true) // disable event during answer display

  const pickedIndices = [] // stores indices of shown ships

	const delay = () => new Promise(resolve => setTimeout(resolve, 3000))

	function displayCorrectAnswer() {
		setEventEnabled(false)
		// show unhidden ship for a sec before going to next round
		setDisplayState('unhidden')
		delay().then(() => {
			input.current.value = ''
			setIsCorrectAnswer()
			setDisplayState('hidden')
			setEventEnabled(true)
			setProgress(0)
			newGameRound()
		})
	}

	function checkAnswer() {
		const answer = input.current.value.toLowerCase()
		if (eventEnabled && (answer === shipName.toLowerCase() || altNames.includes(answer))) {
			// correct answer
			setScore((score) => score + 1)
			setIsCorrectAnswer(true)
			clearInterval(loopProgress.current)
			clearTimeout(deadline.current)
			displayCorrectAnswer()
		}
	}

	function newHiddenShip() {
		let newShipPicked = false, randShipIndex
		while (!newShipPicked) {
			randShipIndex = Math.floor(Math.random() * names.length)

			if (!pickedIndices.includes(randShipIndex)) {
				pickedIndices.push(randShipIndex)
				newShipPicked = true
			}
		}
		setShipName(names[randShipIndex]['filename'])
		setAltNames(names[randShipIndex]['names'])
	}

	function newGameRound() {
		setRounds((rounds) => rounds + 1)
		newHiddenShip()

		const roundDuration = 5000
		const interval = 10
		const totalSteps = roundDuration / interval

		loopProgress.current = setInterval(() => {
			if (progress < 100) {
				setProgress((prevProgress) => prevProgress + (100 / totalSteps))
			}
		}, interval)

		deadline.current = setTimeout(() => {
			// not answered
			setIsCorrectAnswer(false)
			clearInterval(loopProgress.current)
			displayCorrectAnswer()
		}, roundDuration)
	}

	function startGame() {
		setScore(0)
		setAvgSpeed(0)
		setRounds(0)
		setAnswerLog([])
		setGameRunning(true)
		setGameEnd(false)
		newGameRound()
	}

	useEffect(() => {
		// log answer details
		if (isCorrectAnswer !== undefined) {
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
	}, [isCorrectAnswer])

	useEffect(() => {
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
	}, [rounds])

  return (
    <>
		{
			!gameRunning && !gameEnd &&
			<>
				<div id='answer-display'>Azur Lane Guessing Game</div>
				<div id='container'>
					<p>Guess the Azur Lane character by its silhouette!</p>
					<p>10 rounds with each round having 10 second limit.</p>
					<p>No retrofit skins and skins in general.</p>
					<p>Some characters have nicknames which are also correct.</p>
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
						displayState === 'unhidden' && isCorrectAnswer
							? 'correct-ans-glow'
							: displayState === 'unhidden' && !isCorrectAnswer
								? 'wrong-ans-glow'
								: ''
					}>
						{displayState === 'hidden' ? `Round ${rounds} of 10` : shipName}
				</div>
				<div id='container'>
					<img src={`https://raw.githubusercontent.com/risbi0/Whos-that-shipgirl/main/img/${displayState}/${shipName.replace(' ', '%20')}.png`}/>
				</div>
				<input type='text' ref={input} onInput={checkAnswer} placeholder='Who?' maxLength='30'></input>
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
