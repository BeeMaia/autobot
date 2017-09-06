import { expect } from 'chai';
import { Turn } from '../../spec/turn';
import { DialogueInvalidError } from '../../spec/dialogue_invalid_error';
import { getLocalePath } from '../translator';
import { Translator } from '../../translator';
import { createTextMessage } from './response';

describe('turn.ts', () => {
  it('should not construct empty turns', () => {
    expect(() => {
      new Turn({});
    }).to.throw(DialogueInvalidError);
  });

  it('should match when only one choice', () => {
    expect(new Turn({
      Bot: 'Hello',
    }).matches(createTextMessage('Hello '))).to.be.true;
  });

  it('should not match when only one incorrect choice', () => {
    expect(new Turn({
      Bot: 'Hello',
    }).matches(createTextMessage('bye '))).to.be.false;
  });
  
  it('should match when one of multiple is correct', () => {
    const turn = new Turn({
      Bot: [
        'Hello',
        'Hi',
      ],
    });
    expect(turn.matches(createTextMessage('Hi'))).to.be.true;
    expect(turn.matches(createTextMessage('Hello'))).to.be.true;
  });

  it('should not match when all of multiple is incorrect', () => {
    const turn = new Turn({
      Bot: [
        'Hello',
        'Hi',
      ],
    });
    expect(turn.matches(createTextMessage('Bye'))).to.be.false;
  });

  it('should refuse to construct bad branches', () => {
    expect(() => {
      new Turn({
        0: [{
          Human: 'hello',

        }],
        1: [{
          Bot: 'world',
        }],
      },
      );
    }).to.throw(DialogueInvalidError);
  });

  it('should match branches correctly', () => {
    const branch1 = [{
      Bot: 'Hello world',
    }];
    const branch2 = [{
      Bot: 'Hi world',
    }];
    expect(new Turn({
      1: branch1,
      2: branch2,
    }).matches(createTextMessage('Hello world'))).to.deep.equal([new Turn(branch1[0])]);
  });

  it('should fail to match branches correctly', () => {
    const branch1 = [{
      Bot: 'Hello world',
    }];
    const branch2 = [{
      Bot: 'Hi world',
    }];
    expect(new Turn({
      1: branch1,
      2: branch2,
    }).matches(createTextMessage('Bye world'))).to.be.false;
  });

  it('should unbox human lists as branches', () => {
    expect(new Turn({
      Human: [
        'One',
        'Two',
      ],
    })).to.eql(new Turn({
      1: {
        Human: 'One',
      },
      2: {
        Human: 'Two',
      },
    }));
  });

  it('should create the right number of branches for simple cases', () => {
    const turns = Turn.createTurns([
      { Human: 'Hi' },
      { Bot: 'Hey there' },
      { Human: 'How are you?' },
      { Bot: 'I\'m good' },
    ]);
    expect(turns[0].numRunnersRequired).to.equal(1);
  });

  it('should create the right number of branches for complex cases', () => {
    const turns = Turn.createTurns([
      {
        Human: 'Hi',
      },
      {
        1: [
          {
            Bot: 'Hey',
          },
          {
            1: [
              {
                Human: 'How are you?',
              },
              {
                Bot: 'I am good',
              },
            ],
            2: [
              {
                Bot: 'Is your day well?',
              },
            ],
          },
        ],
        2: [
          { Human: 'Hello' },
        ],
      },
      {
        Bot: 'Do you need assistance?',
      },
      {
        1: {
          Human: 'Yes',
        },
        2: {
          Human: 'No',
        },
      },
      { Bot: 'Ok' },
    ]);
    expect(turns[0].numRunnersRequired).to.equal(3);
    expect(turns[1].numRunnersRequired).to.equal(3);
    expect(turns[1].botBranches[0][0].numRunnersRequired).to.equal(2);
    expect(turns[1].humanBranches[0][0].numRunnersRequired).to.equal(1);
    expect(turns[1].botBranches[0][1].humanBranches[0][0].numRunnersRequired).to.equal(1);
    expect(turns[1].botBranches[0][1].botBranches[0][0].numRunnersRequired).to.equal(1);
    expect(turns[2].numRunnersRequired).to.equal(2);
    expect(turns[3].numRunnersRequired).to.equal(2);
    expect(turns[4].numRunnersRequired).to.equal(1);
  });

  it('should invoke the translator to multiply responses', () => {
    Translator.loadTranslation([getLocalePath('locale1.json')]);
    expect(new Turn({
      Human: [
        'Hello <$friend>',
        'Hey',
      ],
    })).to.eql(new Turn({
      Human: [
        'Hello amigo',
        'Hello mate',
        'Hey',
      ],
    }));
  });

  it('branches should not match when numRunners is exceeded', () => {
    const turn = new Turn({
      1: [
        { Bot: 'Hello' },
      ],
    });
    expect(turn.matches(createTextMessage('Hello'))).to.have.length(1);
    turn.botBranches[0][0].numRunnersEntered += 1;
    expect(turn.matches(createTextMessage('Hello'))).to.eql([]);
  });
});
