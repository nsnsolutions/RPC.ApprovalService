module.exports = bookshelf => {
    bookshelf.Model = bookshelf.Model.extend({
        upsert (attributes) {

            return this.save(attributes, { method: 'update'})
                .then(m => { m.$method='update'; return m; })
                .catch(err => {

                    if (err instanceof bookshelf.Model.NoRowsUpdatedError)

                        return this.save(attributes, { method: 'insert' })
                            .then(m => { m.$method='insert'; return m; })

                    throw err;
                });
        }
    });
}
