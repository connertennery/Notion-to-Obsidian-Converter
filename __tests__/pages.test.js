const fs = require('fs');
const {correctMarkdownLinks, getLinkURL} = require('../src/pages.js')


test ('getLinkURL', () => {
  const link = "[Testing](Project/Testing.md)"
  const expected = "Project/Testing.md"
  
  const result = getLinkURL(link)
  expect(result).toBe(expected)
})

test('page link', () => {
  const link = "[Testing](Project%2008f6f3d0d2eb1c3c483eeafb703866c0/Testing%20c5c7c49a7992411e795ca0a16ce45574.md)"
  const expected_link =
    {
      content: "[[Testing]]",
      links: 1
    }

  const result = correctMarkdownLinks(link)
  expect(result).toStrictEqual(expected_link)
});

test('page link with :', () => {
  const link = "[Poly: gon](Project%2008f6f3d0d2eb1c3c483eeafb703866c0/Testing%20c5c7c49a7992411e795ca0a16ce45574.md)"
  const expected_link =
    {
      content: "[[Poly gon]]",
      links: 1
    }

  const result = correctMarkdownLinks(link)
  expect(result).toStrictEqual(expected_link)
});

test('no match', () => {
  const content = "no match"
  const expected_link =
    {
      content: content,
      links: 0
    }

  const result = correctMarkdownLinks(content)
  expect(result).toStrictEqual(expected_link)
});

test('notion link', () => {
  const content = "https://www.notion.so/Piticli-example-lib-2daa8759cb30d36a14a153940af176a2"
  const expected_link =
    {
      content: "[[Piticli example lib]]",
      links: 1
    }

  const result = correctMarkdownLinks(content)
  expect(result).toStrictEqual(expected_link)
});

test('markdown link', () => {
  const link = "[https://google.com/](https://google.com/)"
  const expected_link =
    {
      content: "[https://google.com/](https://google.com/)",
      links: 1
    }

  const result = correctMarkdownLinks(link)
  expect(result).toStrictEqual(expected_link)

  const link2 = "[Google™](https://google.com/)"
  const expected_link2 =
    {
      content: "[Google™](https://google.com/)",
      links: 1
    }

  const result2 = correctMarkdownLinks(link2)
  expect(result2).toStrictEqual(expected_link2)
});

test('markdown link ipfs', () => {
  const link = "[IPFS link](ipfs://127.0.0.1/)"
  const expected_link =
    {
      content: "[IPFS link](ipfs://127.0.0.1/)",
      links: 1
    }

  const result = correctMarkdownLinks(link)
  expect(result).toStrictEqual(expected_link)
});

test('page link with /', () => {
  const link = "[Twitter / Multi Chain](Project%20c8bead5a698aa52ec71bf88a2ed058bc/Twitter%20Multi%20Chain%20c8bead5a698aa52ec71bf88a2ed058bc.md)"
  const expected_link =
    {
      content: "[[Twitter Multi Chain]]",
      links: 1
    }

  const result = correctMarkdownLinks(link)
  expect(result).toStrictEqual(expected_link)
});

test('link to page with link to web in name', () => {
  const link = "[Using [Various.io](http://various.io) to query the network](Project%2066d073d471f1de36ef7f80e02d1aa90d/Using%20Various%20io%20to%20query%20the%20network%2066d073d471f1de36ef7f80e02d1aa90d.md)"

  const expected_link =
    {
      content: "[[Using Various io to query the network]]",
      links: 1
    }

  const result = correctMarkdownLinks(link)
  expect(result).toStrictEqual(expected_link)
})


test('link to page with link to page in name', () => {
  const link = "[[Project Looking (UFO 2.0)](../Notes%2066d073d471f1de36ef7f80e02d1aa90d/Project%20Looking%20(UFO%202%200)%20ecf727b208148fada677b1f94ddeb5a7.md)  Guide](Project%2053fe8131995e4e3e2262ce49d1848f74/@Project%20Looking%20(UFO%202%200)%20Guide%201a8d161e9e2b79b68feb137707692407.md)"

  const expected_link =
    {
      content: "[[@Project Looking (UFO 2 0) Guide]]",
      links: 1
    }

  const result = correctMarkdownLinks(link)
  expect(result).toStrictEqual(expected_link)
})

test('embedded image', () => {
  const link = "![20 años de inflación en Argentina en las entradas del cine](Inflation%2000a09c2e0cb422365b7c982f1d01e569/Untitled.png)"
  const expected_link =
    {
      content: "![20 años de inflación en Argentina en las entradas del cine](Inflation/Untitled.png)",
      links: 1
    }
  
  const result = correctMarkdownLinks(link)
  expect(result).toStrictEqual(expected_link)
});

test('embedded image 2', () => {
  const link = "![Ideas%20Almacenaje%20tabla%20de%20surf%20cee24b8c908df4382e2d61c4e5f02781/Untitled.png](Ideas%20Almacenaje%20tabla%20de%20surf%20cee24b8c908df4382e2d61c4e5f02781/Untitled.png)"
  const expected_link =
    {
      content: "![Ideas%20Almacenaje%20tabla%20de%20surf%20cee24b8c908df4382e2d61c4e5f02781/Untitled.png](Ideas%20Almacenaje%20tabla%20de%20surf/Untitled.png)",
      links: 1
    }
  
  const result = correctMarkdownLinks(link)
  expect(result).toStrictEqual(expected_link)
});

test(('test parsing of a whole file'), () => {
  const content = fs.readFileSync("./__tests__/test.content.md", 'utf8')

  const expected =
  {
    content: fs.readFileSync("./__tests__/test.expectation.md", 'utf8'),
    links: 21
  }

  const result = correctMarkdownLinks(content)
  expect(result).toStrictEqual(expected)

});
