// AI Quiz Generator for PralayVeer - Advanced Question Generation System
class AIQuizGenerator {
    constructor() {
        this.questionBank = [];
        this.topics = [
            'fire_safety', 'earthquake_response', 'flood_management', 
            'first_aid', 'evacuation_procedures', 'emergency_communication',
            'natural_disasters', 'man_made_disasters', 'risk_assessment',
            'emergency_supplies', 'shelter_management', 'crowd_control'
        ];
        this.difficultyLevels = ['beginner', 'intermediate', 'advanced'];
        this.questionTypes = ['multiple_choice', 'true_false', 'scenario_based'];
        
        this.init();
    }

    async init() {
        console.log("🤖 Initializing AI Quiz Generator...");
        
        try {
            await this.loadQuestionTemplates();
            await this.generateInitialQuestionBank();
            
            console.log("✅ AI Quiz Generator initialized successfully");
        } catch (error) {
            console.error("❌ Error initializing AI Quiz Generator:", error);
        }
    }

    // Load question templates and patterns
    async loadQuestionTemplates() {
        this.questionTemplates = {
            fire_safety: {
                beginner: [
                    {
                        template: "What should you do first when you discover a fire?",
                        options: [
                            "Try to put out the fire yourself",
                            "Alert others and evacuate immediately", 
                            "Look for the cause of the fire",
                            "Take photos for evidence"
                        ],
                        correct: 1,
                        explanation: "The first priority is always to alert others and evacuate safely."
                    },
                    {
                        template: "Which type of fire extinguisher is suitable for electrical fires?",
                        options: [
                            "Water-based extinguisher",
                            "Foam extinguisher",
                            "CO2 extinguisher",
                            "Wet chemical extinguisher"
                        ],
                        correct: 2,
                        explanation: "CO2 extinguishers are safe for electrical fires as they don't conduct electricity."
                    }
                ],
                intermediate: [
                    {
                        template: "In a multi-story building fire, smoke typically spreads how?",
                        options: [
                            "Horizontally only",
                            "Vertically through stairwells and elevator shafts",
                            "Randomly in all directions",
                            "Downward due to gravity"
                        ],
                        correct: 1,
                        explanation: "Smoke rises and spreads vertically through building openings, making upper floors dangerous."
                    }
                ],
                advanced: [
                    {
                        template: "During a fire emergency in a chemical laboratory, your priority should be:",
                        options: [
                            "Identify the burning chemicals first",
                            "Use water to extinguish all flames",
                            "Evacuate immediately and alert hazmat teams",
                            "Ventilate the area to clear smoke"
                        ],
                        correct: 2,
                        explanation: "Chemical fires require specialized handling. Evacuation and professional response is crucial."
                    }
                ]
            },
            earthquake_response: {
                beginner: [
                    {
                        template: "During an earthquake, if you're indoors, you should:",
                        options: [
                            "Run outside immediately",
                            "Stand in a doorway",
                            "Drop, Cover, and Hold On under a sturdy desk",
                            "Hide under the stairs"
                        ],
                        correct: 2,
                        explanation: "Drop, Cover, and Hold On is the internationally recommended response during earthquakes."
                    },
                    {
                        template: "The safest place during an earthquake is:",
                        options: [
                            "Near windows for quick escape",
                            "Under a heavy table or desk",
                            "In an elevator",
                            "Against an exterior wall"
                        ],
                        correct: 1,
                        explanation: "Sturdy furniture provides protection from falling objects during earthquakes."
                    }
                ],
                intermediate: [
                    {
                        template: "After a major earthquake, you should expect:",
                        options: [
                            "No further seismic activity",
                            "Aftershocks that can be nearly as strong",
                            "Only minor tremors",
                            "Immediate rescue operations"
                        ],
                        correct: 1,
                        explanation: "Aftershocks can continue for hours or days and may cause additional damage."
                    }
                ],
                advanced: [
                    {
                        template: "In earthquake-prone areas, building codes require:",
                        options: [
                            "Only aesthetic considerations",
                            "Seismic-resistant design and construction",
                            "Traditional construction methods only",
                            "Maximum height restrictions only"
                        ],
                        correct: 1,
                        explanation: "Modern building codes incorporate seismic engineering to reduce earthquake damage."
                    }
                ]
            },
            flood_management: {
                beginner: [
                    {
                        template: "When driving through flood water, you should:",
                        options: [
                            "Drive as fast as possible",
                            "Never attempt to drive through flood water",
                            "Use high beams for better visibility",
                            "Keep windows closed only"
                        ],
                        correct: 1,
                        explanation: "Even shallow flood water can sweep away vehicles. Turn around, don't drown."
                    }
                ],
                intermediate: [
                    {
                        template: "Flash floods are particularly dangerous because they:",
                        options: [
                            "Always occur during daylight",
                            "Can develop within minutes with little warning",
                            "Only happen in coastal areas",
                            "Are always predictable"
                        ],
                        correct: 1,
                        explanation: "Flash floods can occur rapidly, leaving little time for evacuation preparations."
                    }
                ]
            },
            first_aid: {
                beginner: [
                    {
                        template: "The first step in treating a severe bleeding wound is:",
                        options: [
                            "Apply a tourniquet",
                            "Clean the wound thoroughly",
                            "Apply direct pressure with a clean cloth",
                            "Give the person water"
                        ],
                        correct: 2,
                        explanation: "Direct pressure helps control bleeding and is the first line of treatment."
                    },
                    {
                        template: "If someone is choking and cannot speak or cough, you should:",
                        options: [
                            "Give them water to drink",
                            "Perform back blows and abdominal thrusts",
                            "Wait for them to clear it themselves",
                            "Have them lie down"
                        ],
                        correct: 1,
                        explanation: "Back blows and abdominal thrusts (Heimlich maneuver) can dislodge the obstruction."
                    }
                ],
                intermediate: [
                    {
                        template: "Signs of shock include:",
                        options: [
                            "High fever and sweating",
                            "Rapid pulse, pale skin, and confusion",
                            "Loud speech and hyperactivity",
                            "Deep, slow breathing"
                        ],
                        correct: 1,
                        explanation: "Shock affects circulation, causing rapid pulse, pale skin, and altered mental state."
                    }
                ]
            },
            evacuation_procedures: {
                beginner: [
                    {
                        template: "During an evacuation, you should:",
                        options: [
                            "Use elevators for faster exit",
                            "Take time to gather personal belongings",
                            "Use stairs and follow evacuation routes",
                            "Wait for others to go first"
                        ],
                        correct: 2,
                        explanation: "Stairs are safer than elevators, and following established routes ensures organized evacuation."
                    }
                ],
                intermediate: [
                    {
                        template: "If you encounter smoke during evacuation, you should:",
                        options: [
                            "Stand upright and walk normally",
                            "Stay low and crawl under the smoke",
                            "Hold your breath and run",
                            "Turn back immediately"
                        ],
                        correct: 1,
                        explanation: "Cleaner air is found closer to the floor, below the smoke layer."
                    }
                ]
            }
        };

        // True/False question templates
        this.trueFalseTemplates = {
            fire_safety: [
                {
                    statement: "You should never use water on an electrical fire.",
                    answer: true,
                    explanation: "Water conducts electricity and can cause electrocution."
                },
                {
                    statement: "It's safe to use elevators during a fire emergency.",
                    answer: false,
                    explanation: "Elevators can malfunction or become trapped, always use stairs during fires."
                }
            ],
            earthquake_response: [
                {
                    statement: "You should immediately run outside during an earthquake.",
                    answer: false,
                    explanation: "Most injuries occur from falling objects while running. Drop, Cover, and Hold On instead."
                },
                {
                    statement: "Aftershocks are always weaker than the main earthquake.",
                    answer: false,
                    explanation: "Aftershocks can sometimes be as strong or stronger than the initial earthquake."
                }
            ]
        };

        // Scenario-based question templates
        this.scenarioTemplates = {
            emergency_response: [
                {
                    scenario: "You're in a crowded shopping mall when the fire alarm sounds. You notice people panicking and pushing toward the main exit, which appears congested. What's your best course of action?",
                    options: [
                        "Follow the crowd to the main exit",
                        "Look for alternative exits and move calmly",
                        "Stay where you are until help arrives",
                        "Try to calm everyone down first"
                    ],
                    correct: 1,
                    explanation: "Alternative exits reduce congestion and panic. Stay calm and help others do the same."
                },
                {
                    scenario: "During a severe earthquake, you're on the 5th floor of an office building. The shaking stops, but you smell gas. What should you do?",
                    options: [
                        "Use the elevator to exit quickly",
                        "Turn on lights to see better",
                        "Evacuate via stairs, avoid using electrical switches",
                        "Open all windows for ventilation"
                    ],
                    correct: 2,
                    explanation: "Gas leaks create explosion risks. Avoid electrical switches and evacuate via stairs immediately."
                }
            ]
        };
    }

    // Generate initial question bank
    async generateInitialQuestionBank() {
        console.log("🔄 Generating initial question bank...");
        
        for (const topic of this.topics) {
            if (this.questionTemplates[topic]) {
                for (const difficulty of this.difficultyLevels) {
                    if (this.questionTemplates[topic][difficulty]) {
                        for (const template of this.questionTemplates[topic][difficulty]) {
                            const question = this.createQuestionFromTemplate(template, topic, difficulty, 'multiple_choice');
                            this.questionBank.push(question);
                        }
                    }
                }
            }
        }

        // Add true/false questions
        for (const topic in this.trueFalseTemplates) {
            for (const template of this.trueFalseTemplates[topic]) {
                const question = this.createTrueFalseQuestion(template, topic);
                this.questionBank.push(question);
            }
        }

        // Add scenario-based questions
        for (const category in this.scenarioTemplates) {
            for (const template of this.scenarioTemplates[category]) {
                const question = this.createScenarioQuestion(template, category);
                this.questionBank.push(question);
            }
        }

        console.log(`✅ Generated ${this.questionBank.length} questions in initial bank`);
    }

    // Create question from template
    createQuestionFromTemplate(template, topic, difficulty, type) {
        return {
            id: this.generateQuestionId(),
            question: template.template,
            type: type,
            topic: topic,
            difficulty: difficulty,
            options: template.options,
            correctAnswer: template.correct,
            explanation: template.explanation,
            points: this.getPointsByDifficulty(difficulty),
            createdAt: new Date(),
            tags: [topic, difficulty, type],
            metadata: {
                source: 'ai_generated',
                template_based: true
            }
        };
    }

    // Create true/false question
    createTrueFalseQuestion(template, topic) {
        return {
            id: this.generateQuestionId(),
            question: template.statement,
            type: 'true_false',
            topic: topic,
            difficulty: 'intermediate',
            options: ['True', 'False'],
            correctAnswer: template.answer ? 0 : 1,
            explanation: template.explanation,
            points: 15,
            createdAt: new Date(),
            tags: [topic, 'true_false'],
            metadata: {
                source: 'ai_generated',
                template_based: true
            }
        };
    }

    // Create scenario-based question
    createScenarioQuestion(template, category) {
        return {
            id: this.generateQuestionId(),
            question: template.scenario,
            type: 'scenario_based',
            topic: category,
            difficulty: 'advanced',
            options: template.options,
            correctAnswer: template.correct,
            explanation: template.explanation,
            points: 25,
            createdAt: new Date(),
            tags: [category, 'scenario_based', 'advanced'],
            metadata: {
                source: 'ai_generated',
                scenario_based: true
            }
        };
    }

    // Generate unique question ID
    generateQuestionId() {
        return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get points by difficulty level
    getPointsByDifficulty(difficulty) {
        const pointMap = {
            beginner: 10,
            intermediate: 15,
            advanced: 20
        };
        return pointMap[difficulty] || 10;
    }

    // Generate personalized quiz based on student performance
    async generatePersonalizedQuiz(studentId, preferences = {}) {
        console.log("🎯 Generating personalized quiz for student:", studentId);
        
        try {
            // Get student performance data
            const studentData = await this.getStudentPerformance(studentId);
            
            // Determine question selection criteria
            const criteria = this.analyzeStudentNeeds(studentData, preferences);
            
            // Select questions based on criteria
            const selectedQuestions = this.selectQuestionsForQuiz(criteria);
            
            // Create quiz object
            const quiz = {
                id: this.generateQuizId(),
                studentId: studentId,
                title: this.generateQuizTitle(criteria),
                questions: selectedQuestions,
                totalPoints: selectedQuestions.reduce((sum, q) => sum + q.points, 0),
                timeLimit: preferences.timeLimit || this.calculateTimeLimit(selectedQuestions.length),
                difficulty: criteria.targetDifficulty,
                topics: [...new Set(selectedQuestions.map(q => q.topic))],
                createdAt: new Date(),
                metadata: {
                    personalized: true,
                    criteria: criteria,
                    ai_generated: true
                }
            };

            console.log("✅ Personalized quiz generated successfully");
            return quiz;
            
        } catch (error) {
            console.error("❌ Error generating personalized quiz:", error);
            // Fallback to random quiz
            return this.generateRandomQuiz(preferences);
        }
    }

    // Analyze student needs based on performance
    analyzeStudentNeeds(studentData, preferences) {
        const criteria = {
            targetDifficulty: 'intermediate',
            weakTopics: [],
            strengthTopics: [],
            questionCount: preferences.questionCount || 10,
            focusAreas: preferences.topics || [],
            avoidRecentQuestions: true
        };

        if (studentData && studentData.topicScores) {
            // Identify weak topics (below 70% accuracy)
            criteria.weakTopics = Object.entries(studentData.topicScores)
                .filter(([topic, score]) => score < 0.7)
                .map(([topic, score]) => topic);

            // Identify strength topics (above 85% accuracy)
            criteria.strengthTopics = Object.entries(studentData.topicScores)
                .filter(([topic, score]) => score > 0.85)
                .map(([topic, score]) => topic);

            // Adjust difficulty based on overall performance
            const overallScore = studentData.averageScore || 0.5;
            if (overallScore < 0.5) {
                criteria.targetDifficulty = 'beginner';
            } else if (overallScore > 0.8) {
                criteria.targetDifficulty = 'advanced';
            }
        }

        return criteria;
    }

    // Select questions for quiz based on criteria
    selectQuestionsForQuiz(criteria) {
        let availableQuestions = [...this.questionBank];
        let selectedQuestions = [];

        // Prioritize weak topics (60% of questions)
        const weakTopicCount = Math.floor(criteria.questionCount * 0.6);
        if (criteria.weakTopics.length > 0) {
            const weakQuestions = availableQuestions.filter(q => 
                criteria.weakTopics.includes(q.topic) &&
                (q.difficulty === criteria.targetDifficulty || 
                 q.difficulty === this.getEasierDifficulty(criteria.targetDifficulty))
            );
            
            selectedQuestions.push(...this.randomSample(weakQuestions, weakTopicCount));
        }

        // Add variety questions (40% of questions)
        const remainingCount = criteria.questionCount - selectedQuestions.length;
        const usedQuestionIds = new Set(selectedQuestions.map(q => q.id));
        
        const varietyQuestions = availableQuestions.filter(q => 
            !usedQuestionIds.has(q.id) &&
            (criteria.focusAreas.length === 0 || criteria.focusAreas.includes(q.topic))
        );

        selectedQuestions.push(...this.randomSample(varietyQuestions, remainingCount));

        // Shuffle the final selection
        return this.shuffleArray(selectedQuestions);
    }

    // Generate dynamic questions using AI patterns
    async generateDynamicQuestion(topic, difficulty, type = 'multiple_choice') {
        console.log(`🤖 Generating dynamic question: ${topic} - ${difficulty} - ${type}`);
        
        try {
            let newQuestion;

            switch (type) {
                case 'multiple_choice':
                    newQuestion = await this.generateDynamicMultipleChoice(topic, difficulty);
                    break;
                case 'true_false':
                    newQuestion = await this.generateDynamicTrueFalse(topic, difficulty);
                    break;
                case 'scenario_based':
                    newQuestion = await this.generateDynamicScenario(topic, difficulty);
                    break;
                default:
                    throw new Error('Unknown question type');
            }

            // Add to question bank
            this.questionBank.push(newQuestion);
            
            console.log("✅ Dynamic question generated successfully");
            return newQuestion;
            
        } catch (error) {
            console.error("❌ Error generating dynamic question:", error);
            return null;
        }
    }

    // Generate dynamic multiple choice question
    async generateDynamicMultipleChoice(topic, difficulty) {
        // Use pattern matching and variation generation
        const templates = this.questionTemplates[topic]?.[difficulty] || [];
        if (templates.length === 0) {
            throw new Error(`No templates available for ${topic} - ${difficulty}`);
        }

        // Select a random template and create variations
        const baseTemplate = templates[Math.floor(Math.random() * templates.length)];
        
        // Create variations by modifying the base template
        const variations = this.createQuestionVariations(baseTemplate, topic, difficulty);
        
        return variations[0]; // Return the first variation
    }

    // Create question variations
    createQuestionVariations(baseTemplate, topic, difficulty) {
        const variations = [];
        
        // Create 3 variations of each base template
        for (let i = 0; i < 3; i++) {
            const variation = {
                ...baseTemplate,
                id: this.generateQuestionId(),
                topic: topic,
                difficulty: difficulty,
                type: 'multiple_choice',
                points: this.getPointsByDifficulty(difficulty),
                createdAt: new Date(),
                metadata: {
                    source: 'ai_generated',
                    variation: i + 1,
                    base_template: baseTemplate.template
                }
            };

            // Shuffle options to create variations
            if (baseTemplate.options && baseTemplate.options.length > 0) {
                const shuffledOptions = this.createShuffledOptions(baseTemplate.options, baseTemplate.correct);
                variation.options = shuffledOptions.options;
                variation.correctAnswer = shuffledOptions.correctIndex;
            }

            variations.push(variation);
        }

        return variations;
    }

    // Create shuffled options while maintaining correct answer
    createShuffledOptions(originalOptions, correctIndex) {
        const options = [...originalOptions];
        const correctAnswer = options[correctIndex];
        
        // Shuffle all options
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        
        // Find new position of correct answer
        const newCorrectIndex = options.indexOf(correctAnswer);
        
        return {
            options: options,
            correctIndex: newCorrectIndex
        };
    }

    // Get student performance data
    async getStudentPerformance(studentId) {
        try {
            // In production, this would query Firebase for student performance
            // For demo, return sample data
            return {
                studentId: studentId,
                averageScore: 0.65,
                totalQuizzes: 5,
                topicScores: {
                    fire_safety: 0.8,
                    earthquake_response: 0.5,
                    flood_management: 0.6,
                    first_aid: 0.9,
                    evacuation_procedures: 0.7
                },
                recentQuestions: [],
                lastQuizDate: new Date(Date.now() - 86400000 * 3) // 3 days ago
            };
        } catch (error) {
            console.error("❌ Error getting student performance:", error);
            return null;
        }
    }

    // Generate random quiz as fallback
    generateRandomQuiz(preferences = {}) {
        const questionCount = preferences.questionCount || 10;
        const selectedQuestions = this.randomSample(this.questionBank, questionCount);
        
        return {
            id: this.generateQuizId(),
            title: 'Disaster Preparedness Quiz',
            questions: selectedQuestions,
            totalPoints: selectedQuestions.reduce((sum, q) => sum + q.points, 0),
            timeLimit: preferences.timeLimit || this.calculateTimeLimit(selectedQuestions.length),
            difficulty: 'mixed',
            topics: [...new Set(selectedQuestions.map(q => q.topic))],
            createdAt: new Date(),
            metadata: {
                personalized: false,
                random: true
            }
        };
    }

    // Utility functions
    generateQuizId() {
        return 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateQuizTitle(criteria) {
        const titles = [
            'Personalized Disaster Preparedness Quiz',
            'Adaptive Safety Knowledge Test',
            'Custom Emergency Response Quiz',
            'Tailored Safety Assessment'
        ];
        
        if (criteria.weakTopics.length > 0) {
            const topicName = criteria.weakTopics[0].replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `${topicName} Focused Quiz`;
        }
        
        return titles[Math.floor(Math.random() * titles.length)];
    }

    calculateTimeLimit(questionCount) {
        return questionCount * 90; // 90 seconds per question
    }

    getEasierDifficulty(difficulty) {
        const difficultyMap = {
            advanced: 'intermediate',
            intermediate: 'beginner',
            beginner: 'beginner'
        };
        return difficultyMap[difficulty] || 'beginner';
    }

    randomSample(array, count) {
        const shuffled = this.shuffleArray([...array]);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Get quiz statistics
    getQuizStatistics() {
        const stats = {
            totalQuestions: this.questionBank.length,
            topicDistribution: {},
            difficultyDistribution: {},
            typeDistribution: {}
        };

        this.questionBank.forEach(question => {
            // Topic distribution
            stats.topicDistribution[question.topic] = 
                (stats.topicDistribution[question.topic] || 0) + 1;

            // Difficulty distribution
            stats.difficultyDistribution[question.difficulty] = 
                (stats.difficultyDistribution[question.difficulty] || 0) + 1;

            // Type distribution
            stats.typeDistribution[question.type] = 
                (stats.typeDistribution[question.type] || 0) + 1;
        });

        return stats;
    }
}

// Export the AI Quiz Generator
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIQuizGenerator;
} else {
    window.AIQuizGenerator = AIQuizGenerator;
}