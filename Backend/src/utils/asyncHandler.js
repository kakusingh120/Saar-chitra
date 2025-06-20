// promise wala syntax
const asyncHandler = (func) => {
    return (req, res, next) => {
        Promise.resolve(func(req, res, next))
            .catch((err) => next(err))
    }
}


export { asyncHandler }







// const asyncHandler = () => {}
// const asyncHandler = () => {() => {}}
// const asyncHandler = () => () => {}
// const asyncHandler = () => async () => {}





// // try catch wala wrapper function syntax
// const asyncHandler = (func) => async (req, res, next) => {
//     try {
//         await func(req, res, next)
//     } catch (err) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message,
//         })
//     }
// }  